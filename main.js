//require all the triggers
require('cloud/controllers/comment.js');
require('cloud/controllers/user.js');
require('cloud/controllers/item.js');
require('cloud/controllers/like.js');

/*
* -------------   CLOUD
* -------------   FUNCTIONS
*/
Parse.Cloud.define("getItemAvgRate", function(request, response) {
  var item = new Parse.Object("Item");
  item.id = request.params.itemId;

  var query = new Parse.Query("Comment");
  query.equalTo("parent", item);
  query.find({
    success: function(comments) {

      console.log("Comments size finds out: " + comments.length);

      if(comments.length == 0)  {
        //no comment, rate is 0
        response.success("" + 0);

      } else  {
        var i;
        var rate = [];
        var rep = [];
        var addFact;
        var num = 0;
        var den = 0;

        for(i=0; i<comments.length; i++)  {
          rate[i] = comments[i].get("rate");
        }


        for(i=0; i<comments.length; i++)  {
          rep[i] = Math.pow(2, comments[i].get("reputation"));
        }

        addFact = 1 - Math.min.apply(null, rep);
        console.log("addFact: " + addFact);

        for(i=0; i<rep.length; i++)
          rep[i] += addFact;

        for(i=0; i<rep.length; i++) {
          den += rep[i];
          num += rep[i] * rate[i];
        }

        response.success("" + (num / den));


      }        
    },
    error: function() {

      response.error("Comments lookup failed");
    }
  });
});

Parse.Cloud.define("getUserReputation", function(request, response) {
  var user = new Parse.User();
  user.id = request.params.userId;

  var query = new Parse.Query("Comment");
  query.equalTo("createdBy", user);
  query.find({
    success: function(results) {
      var sum = 0;
      for (var i = 0; i < results.length; ++i) {
        sum += results[i].get("reputation");
      }

      response.success(sum);
    },
    error: function() {

      response.error("user lookup failed");
    }
  });
});