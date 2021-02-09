//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-matt:Mochiboy1.@cluster0.dcczm.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// mongoose schema
const itemsSchema = new mongoose.Schema({
  name: String,
});

// mongoose model
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});


const defaultItems = [item1, item2, item3];

// creating list schema
const listSchema = {
  name: String,
  // items property has an array of item documents that follows the itemSchema.
  items: [itemsSchema]
};

// creating mongoose model for List and follows listSchema
const List = mongoose.model("List", listSchema);


// GET to render home route page
app.get("/", function(req, res) {

  // READ and pass results to res.render for the list.ejs
  Item.find({}, function(err, foundItems) {
    // When array of documents is empty, insert default items into collection
    if (foundItems.length === 0) {
      // Inserting the array of documents into the items collection
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Items successfully saved to DB.");
        }
      });
      // After inserting collections to DB, redirect to home route
      res.redirect("/");
      // When there are items in the item collecton, render the list
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

// GET for custom lists, uses ejs params
app.get("/:listName", function(req, res) {
  const customList = _.capitalize(req.params.listName);

  // Check to see if listName already exists.
  List.findOne({
    name: customList
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customList,
          // pass default items array
          items: defaultItems
        });
        // save new list into list collection
        list.save();
        // Refresh page by redirecting to same page
        res.redirect("/" + customList);
      } else {
        // Show existing list, show list ejs and grab properties from the foundList to populate the page
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        })
      }
    }
  });



});

app.post("/", function(req, res) {

  // new item entered from ejs doc set to itemName
  const itemName = req.body.newItem;
  const listName = req.body.list;
  // creating a new mongoose document with Item model and schema
  const item = new Item({
    name: itemName
  });
  // check if list is for today/home or a custom list
  if (listName === "Today") {
    // save item into collection of items
    item.save();
    res.redirect("/");
  } else {
    // Find list in collection that matches listName
    List.findOne({
      name: listName
    }, function(err, foundList) {
      // Add new item to the foundList document with items array
      foundList.items.push(item);
      // save foundList changes
      foundList.save();
      // Redirect to page with listName
      res.redirect("/" + listName);
    })
  }

});

app.post("/delete", function(req, res) {
      // Received _id from checkbox value
      const checkedItemId = req.body.checkbox;
      const listName = req.body.listName;

      if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err) {
          if (!err) {
            console.log("Successfully deleted checked item.")
            res.redirect("/");
          }
        });
      } else {
        // model.findOneAndUpdate({Condition}, {Update}, callback(err, results){})
        // mongodb $pull: {arrayName: query for which item to pull}. This allows us to delete an item on a custom list and redirect us to the same updated custom list
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
          if (!err) {
            res.redirect("/" + listName);
          }
        });
      }
      });



    app.get("/about", function(req, res) {
      res.render("about");
    });

    app.listen(3000, function() {
      console.log("Server started on port 3000");
    });
