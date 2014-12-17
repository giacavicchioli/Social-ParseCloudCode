/*
* -------------   LIKE
* -------------   TRIGGERS
*/

/*
* -------------   BEFORE SAVE
*/
Parse.Cloud.beforeSave("Like", function(request, response) {

  query = new Parse.Query("Comment");
  query.get(request.object.get("comment").id, {
    success: function(comment) {
      if(request.object.get("like"))
        comment.increment("reputation");
      else
        comment.increment("reputation", -1);

      comment.save();

      response.success();
      
    }, error: function(error) {
      console.log("Lookup error for the comment");

      response.error("BeforeSave(Like) - Lookup error for the comment");
    }
  });
});

/*
* -------------   AFTER SAVE
*/

/*
* -------------   BEFORE DELETE
*/

/*
* -------------   AFTER SAVE
*/
Parse.Cloud.afterDelete("Like", function(request) {
  query = new Parse.Query("Comment");
  query.get(request.object.get("comment").id, {
    success: function(comment) {
      if(request.object.get("like"))
        comment.increment("reputation", -1);
      else
        comment.increment("reputation");

      comment.save();
      console.log("AfterDelete(Like) - comment's reputation adjusted");
      
    }, error: function(error) {
      console.log("Lookup error for the comment.");

      console.error("AfterDelete(Like) - caused by a trigger cascade");
    }
  });
});