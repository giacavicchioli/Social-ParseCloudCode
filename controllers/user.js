/*
* -------------   USER
* -------------   TRIGGERS
*/

/*
* -------------   BEFORE SAVE
*/
Parse.Cloud.beforeSave(Parse.User, function(request, response) {

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
Parse.Cloud.afterSave(Parse.User, function(request, response) {
  
  //send email
  if(!request.object.existed())  {

    var Mailgun = require('mailgun');
    Mailgun.initialize('xxx', 'xxx');

    Mailgun.sendEmail({
      to: "xxx",
      from: "noreply@giacomocavicchioli.com",
      subject: "New user just signup!",
      text: "A new user just signed up with username: " + request.user.get("username") + " and email: " + request.user.get("email")
    }, {
      success: function(httpResponse) {
        console.log("Email just sent!");
        console.log(httpResponse);
      },
      error: function(httpResponse) {
        console.log("Error sending email.");
        console.error(httpResponse);
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
Parse.Cloud.afterDelete(Parse.User, function(request) {
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