/*
* -------------   COMMENT
* -------------   TRIGGERS
*/

/*
* -------------   BEFORE SAVE
*/
Parse.Cloud.beforeSave("Comment", function(request, response) {

  //check 1 < rate < 5
  var rate = request.object.get("rate");
  if(rate > 5)
    request.object.set("rate", 5);
  if(rate < 1 || rate == null)
    request.object.set("rate", 1);

  //initialize reputation
  if(request.object.get("reputation") == null)
    request.object.set("reputation", 0);

  //return success
  response.success();
});

/*
* -------------   AFTER SAVE
*/
Parse.Cloud.afterSave("Comment", function(request) {

  //if it's the first save
  if(!request.object.existed())  {
    //increment the item's comments
    query = new Parse.Query("Item");
    query.get(request.object.get("parent").id, {
      success: function(item) {

        item.increment("comments");
        item.save();

      }, error: function(error) {
       console.log("Error searching the item - error afterSave@Comment 1.");
     }
   });

    //increment the User's comments
    query = new Parse.Query(Parse.User);
    query.get(request.object.get("createdBy").id, {
      success: function(user) {

        user.increment("comments");
        user.save();
        
      }, error: function(error) {
        console.log("Error searching the item - error afterSave@Comment 2");
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
Parse.Cloud.afterDelete("Comment", function(request) {
  
  //decrement the Item's comments
  query = new Parse.Query("Item");
  query.get(request.object.get("parent").id, {
    success: function(item) {

      item.increment("comments", -1);
      item.save();

    }, error: function(error) {
      console.log("Error searching the item - error afterDelete@Comment 1.");
    }
  });
  
  //decrement the User's comments
  Parse.Cloud.useMasterKey();
  query = new Parse.Query(Parse.User);
  query.get(request.object.get("createdBy").id, {
    success: function(user) {
      
      user.increment("comments", -1);
      user.save();
      
    }, error: function(error) {
      console.log("Error searching the user - error afterDelete@Comment 2");
    }
  });

  //delete all the the relative likes
  var Comment = Parse.Object.extend("Comment");
  var comment = new Comment();
  comment.id = request.object.id;

  query = new Parse.Query("Like");
  query.equalTo("comment", comment);
  query.find({
    success: function(likes) {
      Parse.Object.destroyAll(likes, {
        success: function() {
          console.log("afterDelete Comment destroyed all the comment's likes");
        },
        error: function(error) {
          console.error("Error deleting related likes " + error.code + ": " + error.message);
        }
      });
    },
    error: function(error) {
      console.error("Error finding related likes " + error.code + ": " + error.message);
    }
  });

});