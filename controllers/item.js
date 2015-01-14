/*
* -------------   ITEM
* -------------   TRIGGERS
*/
var Image = require("parse-image");


/*
* -------------   BEFORE SAVE
*/
Parse.Cloud.beforeSave("Item", function(request, response) {
  var item = request.object;

  var c = item.get("comments");
  if(c < 0 || c == null)
    item.set("comments", 0);

  //if it's a new save
  if(!item.existed())  {
    query = new Parse.Query("Item");
    query.equalTo("scanFormat", item.get("scanFormat"));
    query.equalTo("scanContent", item.get("scanContent"));
    query.count({
      success: function(count) {
        if(count != 0)
          response.error("Item already present");
      },
      error: function(error) {
        response.error("Lookup error for item");
      }
    });
  }

  //IMAGE PROCESSING

  if (!item.dirty("picture")) {
    response.success();
    return;
  }
  
  Parse.Cloud.httpRequest({
    url: item.get("picture").url()
 
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
      width: 512,
      height: 512
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
    var cropped = new Parse.File("picture.jpg", { base64: base64 });
    return cropped.save();
 
  }).then(function(cropped) {
    // Attach the image file to the original object.
    item.set("picture", cropped);
 
  }).then(function(result) {
    response.success();
  }, function(error) {
    response.error(error);
  });

  

});

/*
* -------------   AFTER SAVE
*/
Parse.Cloud.afterSave("Item", function(request) {
  var item = request.object;
  
  if(!item.existed()) { //if it's the first save
    console.log("afterSave Item it's the first time you save this item");
    

    query = new Parse.Query(Parse.User);
    query.get(item.get("createdBy").id, {
      success: function(user) {

        user.increment("itemSaved");
        user.save();
        console.log("afterSave Item incremented the createdBy user's itemSaved");

        //sendind mail
        var Mailgun = require("mailgun");
        Mailgun.initialize('xxx', 'xxx');
        Mailgun.sendEmail({
          to: "gia.cavicchioli@gmail.com",
          from: "noreply@giacomocavicchioli.com",
          subject: "[BARANK] New item created by " + user.get("username"),
          text: user.get("firstname") + " " + user.get("lastname") + " (username: " + user.get("username") + ") just created a new object:\nTitle: " + item.get("title") + "\nBrand: " + item.get("brand") + "\nDescription: " + item.get("description")
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

        Mailgun.sendEmail({
          to: user.get("email"),
          from: "noreply@giacomocavicchioli.com",
          subject: "Thank you " + user.get("username"),
          text: "Thank you " + user.get("username") + ", your item has been saved correctly.\nKeep using Barank :)" + 
                "\nTitle: " + item.get("title") +
                "\nBrand: " + item.get("brand") +
                "\nDescription: " + item.get("description")
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
  //delete all the comments
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

  //decrement the user itemSaved
  Parse.Cloud.useMasterKey();
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