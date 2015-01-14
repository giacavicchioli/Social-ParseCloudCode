/*
* -------------   USER
* -------------   TRIGGERS
*/
var Image = require("parse-image");

/*
* -------------   BEFORE SAVE
*/
Parse.Cloud.beforeSave(Parse.User, function(request, response) {
  var user = request.object;

  var comments = user.get("comments");
  if(comments == null || comments < 0)
    user.set("comments", 0);  

  var itemSaved = user.get("itemSaved");
  if(itemSaved == null || itemSaved < 0)
    user.set("itemSaved", 0);

  if(user.get("username").length < 6 || user.get("username").length > 20)
    response.error("username must be longer than 6");
  else if(!user.get("profilePic"))  {
    response.error("You have to supply a profile pic");
    return;
  }
  
  if (!user.dirty("profilePic")) {
    response.success();
    return;
  }
 
  Parse.Cloud.httpRequest({
    url: user.get("profilePic").url()
 
  }).then(function(response) {
    var image = new Image();
    return image.setData(response.buffer);
 
  }).then(function(image) {
    // Crop the image to the smaller of width or height.
    var size = Math.min(image.width(), image.height());
    return image.crop({
      left: (image.width() - size) / 2,
      top: (image.height() - size) / 2,
      width: size,
      height: size
    });
 
  }).then(function(image) {
    // Resize the image to 256x256.
    return image.scale({
      width: 256,
      height: 256
    });
 
  }).then(function(image) {
    // Make sure it's a JPEG to save disk space and bandwidth.
    return image.setFormat("JPEG");
 
  }).then(function(image) {
    // Get the image data in a Buffer.
    return image.data();
 
  }).then(function(buffer) {
    // Save the image into a new file.
    var base64 = buffer.toString("base64");
    var cropped = new Parse.File("profile_pic.jpg", { base64: base64 });
    return cropped.save();
 
  }).then(function(cropped) {
    // Attach the image file to the original object.
    user.set("profilePic", cropped);
 
  }).then(function(result) {
    response.success();
  }, function(error) {
    response.error(error);
  });
});

/*
* -------------   AFTER SAVE
*/
Parse.Cloud.afterSave(Parse.User, function(request, response) {
  var user = request.object;
  //send email
  if(!user.existed())  {

    var Mailgun = require('mailgun');
    Mailgun.initialize('xxx', 'xxx');

    Mailgun.sendEmail({
      to: "gia.cavicchioli@gmail.com",
      from: "noreply@giacomocavicchioli.com",
      subject: "[BARANK] New user just signup!",
      text: "A new user just signed up.\n" +
            "\nfirstname: " + user.get("firstname") +
            "\nlastname: " + user.get("lastname") +
            "\nusername: " + user.get("username") + 
            "\nemail: " + request.user.get("email")
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