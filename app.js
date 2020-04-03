const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require('lodash');

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Create new mongoDB with mongoose
mongoose.connect("mongodb+srv://admin-jude:testing1988@cluster0-xffxh.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

//Create new schema for items collection
const itemsSchema = new mongoose.Schema ({
  name: String
});

//Create model(for collection)
const Item = mongoose.model("Item", itemsSchema);

//Create documents to be added
const cook = new Item ({
  name: "Cook food"
});

const eat = new Item ({
  name: "Eat food"
});

const enjoy = new Item ({
  name: "Enjoy food"
});

const defaultItems = [cook, eat, enjoy];

//Schema for custom lists collection?
const listSchema = {
  name: String,
  items: [itemsSchema]
};

//Mongoose model for custom lists
const List = mongoose.model("List", listSchema);

//Insert default items
// Item.insertMany(defaultItems, function(err) {
//   if (err) {
//     console.log(err)
//   } else {
//     console.log("Items added successfully to DB");
//   }
// });

//Show default list
app.get("/", function(req, res) {

  //Find items to be rendered
  Item.find(function (err, foundItems) {
    if (err) {
      console.log(err)
    } else {

      //Check if db has items
      if (foundItems.length === 0){
        //Insert default items because db is empty
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err)
          } else {
            console.log("Items added successfully to DB");
          }
        });
        //Go back to reload page/route now that items are added
        res.redirect("/");
      } else {
        //mongoose.connection.close();
        //Render items that are in db
        res.render("list", {listTitle: "Today", newListItems: foundItems});
        // foundItems.forEach(item => {
        //   console.log(item.name);
        // });
      }
      
    }
  });
});

//Enter and save a custom route and list name
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  
  List.findOne({ name: customListName}, function(err, foundList) {
    if (err) {
      console.log("err");
    } else {
      if (foundList) {
        //Show existing list found
        //We use render to render our ejs
        res.render("List", {
          listTitle: foundList.name, 
          newListItems: foundList.items
        });
      } else {
        //Create a new list
        const list = new List ({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
    }
  }); 

});

//Adding a new item to the db
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list; //The value of the list name passed by the submit button

  const item = new Item ({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.render("List", {
        listTitle: foundList.name, 
        newListItems: foundList.items
      });
    });
  }
  
  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});

//Deleting an item from the list
app.post("/delete", function(req, res){
  //console.log(req.body);
  const checkedListName = req.body.list;
  const checkedItemId = req.body.checkbox;
  if (checkedListName === "Today") {
    Item.deleteOne({ _id: checkedItemId}, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Deletion successful");
        res.redirect("/");
      }
    }); 
  } else {
    //We can now search through the array item under the found list 
    //List.findOne({name: checkedListName}, function(err, foundList) {
    //});
    //or we can use mongo/mongoose db stuff like so
    List.findOneAndUpdate(
      {name: checkedListName},
      {$pull: {items: {_id: checkedItemId}}},
      function(err, foundItem) {
        console.log("Deleted that item");
        res.redirect("/" + checkedListName);
      }
    );
  }
});



// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

// app.get("/about", function(req, res){
//   res.render("about");
// });

app.listen(port, function() {
  console.log("Server started on port " + port);
});
