/*
* -------------   USER
* -------------   TRIGGERS
*/

/*
* -------------   BEFORE SAVE
*/
Parse.Cloud.beforeSave("User", function(request, response) {

  var comments = request.object.get("comments");
  if(comments == null || comments < 0)
    request.object.set("comments", 0);  

  var itemSaved = request.object.get("itemSaved");
  if(itemSaved == null || itemSaved < 0)
    request.object.set("itemSaved", 0);

  var username = request.object.get("username");
  if(username.length < 6 || username.length > 20)
    response.error("username must be longer than 6");
  else  {
    response.success();
  }

});

/*
* -------------   AFTER SAVE
*/

/*
* -------------   BEFORE DELETE
*/

/*
* -------------   AFTER DELETE
*/
Parse.Cloud.afterDelete("User", function(request) {
  query = new Parse.Query("Comment");
  query.equalTo("createdBy", request.object.id);
  query.find({
    success: function(comments) {
      Parse.Object.destroyAll(comments, {
        success: function() {},
        error: function(error) {
          console.error("Error deleting related comments " + error.code + ": " + error.message);
        }
      });
    },
    error: function(error) {
      console.error("Error finding related comments " + error.code + ": " + error.message);
    }
  });
});