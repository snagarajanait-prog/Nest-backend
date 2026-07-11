# MongoDB query practice (shell + Mongoose equivalents)

> Run the shell examples with `mongosh` against `nest_app_dev`. The Mongoose
> equivalents are how the same thing is written in this NestJS codebase.

## CREATE
```js
// shell
db.products.insertOne({ name: "Mouse", price: 799, stock: 25 })
db.products.insertMany([{ name: "Pen", price: 10 }, { name: "Book", price: 200 }])
```
```ts
// mongoose
await this.productModel.create({ name: 'Mouse', price: 799, stock: 25 });
```

## READ / FIND
```js
db.products.find()                                  // all
db.products.find({ category: "electronics" })       // equality
db.products.find({ price: { $gt: 500 } })           // operators: $gt $gte $lt $lte $ne
db.products.find({ name: { $regex: "mou", $options: "i" } })  // case-insensitive contains
db.products.find({ stock: { $gt: 0 }, category: "electronics" }) // AND (implicit)
db.products.find({ $or: [{ price: { $lt: 50 } }, { stock: 0 }] }) // OR
db.products.findOne({ _id: ObjectId("...") })
```
```ts
await this.productModel.find({ price: { $gt: 500 } }).exec();
```

## PROJECTION (choose which fields come back)
```js
db.products.find({}, { name: 1, price: 1, _id: 0 })  // include name+price, hide _id
db.users.find({}, { password: 0 })                   // exclude a field
```
```ts
await this.userModel.findOne({ email }).select('+password'); // re-include a hidden field
```

## UPDATE
```js
db.products.updateOne({ _id: ObjectId("...") }, { $set: { price: 999 } })
db.products.updateMany({ category: "electronics" }, { $inc: { stock: 10 } }) // $inc, $push, $pull, $unset
db.products.findOneAndUpdate({ name: "Mouse" }, { $set: { price: 750 } }, { returnDocument: "after" })
```

## DELETE
```js
db.products.deleteOne({ _id: ObjectId("...") })
db.products.deleteMany({ stock: 0 })
```

## SORT / LIMIT / SKIP (pagination)
```js
db.products.find().sort({ price: -1 }).skip(10).limit(10)  // -1 desc, 1 asc; page 2 of size 10
```
```ts
await this.productModel.find(cond).sort({ price: -1 }).skip((page-1)*limit).limit(limit);
```

## AGGREGATE (pipeline: transform data in stages)
```js
db.products.aggregate([
  { $match: { stock: { $gt: 0 } } },                       // 1. filter
  { $group: { _id: "$category", total: { $sum: 1 },        // 2. GROUP BY category
              avgPrice: { $avg: "$price" } } },
  { $sort: { total: -1 } },                                // 3. order
  { $project: { category: "$_id", total: 1, avgPrice: 1, _id: 0 } } // 4. shape output
])
```

## $lookup (the MongoDB "JOIN")
```js
db.users.aggregate([
  { $lookup: {
      from: "roles",            // other collection
      localField: "role",       // field on users
      foreignField: "_id",      // field on roles
      as: "roleInfo" } },
  { $unwind: "$roleInfo" }      // flatten the joined array
])
```
```ts
// Mongoose shortcut for a simple lookup by ref:
await this.userModel.findById(id).populate('role', 'name');
```

## Quick reference — common operators
- Comparison: `$eq $ne $gt $gte $lt $lte $in $nin`
- Logical: `$and $or $not $nor`
- Element: `$exists $type`
- Update: `$set $unset $inc $push $pull $addToSet`
- Aggregation stages: `$match $group $sort $project $limit $skip $lookup $unwind $count`
