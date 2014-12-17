/*
* -------------   ITEM
* -------------   TRIGGERS
*/

/*
* -------------   BEFORE SAVE
*/
Parse.Cloud.beforeSave("Item", function(request, response) {
  var c = request.object.get("comments");
  if(c < 0 || c == null)
    request.object.set("comments", 0);

  //if it's a new save
  if(!request.object.existed())  {
    query = new Parse.Query("Item");
    query.equalTo("scanFormat", request.object.get("scanFormat"));
    query.equalTo("scanContent", request.object.get("scanContent"));
    query.count({
      success: function(count) {
        if(count == 0)
          response.success();
        else
          response.error("Item already present");
      },
      error: function(error) {
        response.error("Lookup error for item");
      }
    });
  } else
    response.success();

});

/*
* -------------   AFTER SAVE
*/
Parse.Cloud.afterSave("Item", function(request) {

  if(!request.object.existed()) { //if it's the first save
    console.log("afterSave Item it's the first time you save this item");
    
    query = new Parse.Query(Parse.User);
    query.get(request.object.get("createdBy").id, {
      success: function(user) {

        user.increment("itemSaved");
        user.save();
        console.log("afterSave Item incremented the createdBy user's itemSaved");
        
      }, error: function(error) {
        console.log("Error searching the item - error afterSave@Comment 1.");
      }
    });
  }

});

/*
* -------------   BEFORE DELETE
*/

/*
* -------------   AFTER DELETE
*/
Parse.Cloud.afterDelete("Item", function(request) {
  query = new Parse.Query("Comment");
  query.equalTo("parent", request.object.id);
  query.find({
    success: function(comments) {
      Parse.Object.destroyAll(comments, {
        success: function() {
          console.log("afterDelete Item destroyed all the item's comments");
        },
        error: function(error) {
          console.error("Error deleting related comments " + error.code + ": " + error.message);
        }
      });
    },
    error: function(error) {
      console.error("Error finding related comments " + error.code + ": " + error.message);
    }
  });

  query = new Parse.Query(Parse.User);
  query.get(request.object.get("createdBy").id, {
    success: function(user) {

      user.increment("itemSaved", -1);
      user.save();
      console.log("afterDelete Item decremented the createdBy user's itemSaved");

    }, error: function(error) {
      console.error("Error deleting the parent item.");
    }
  });
});