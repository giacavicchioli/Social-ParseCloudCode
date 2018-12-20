Social-ParseCloudCode
=====================

A simple backened for a simple social app using [parse.com](http://www.parse.com).

# Table structure
Here the structure of the parse tables.

## User
* objectId - String
* username - String
* password - String
* firstname - String
* lastname - String
* comments - Number
* itemSaved - Number
* authData - authData
* emailVerified - Boolean
* createdAt - Date
* updatedAt - Date
* ACL - ACL

## Item
* objectId - String
* title - String
* brand - String
* description - String
* createdBy - Pointer<User>
* comments - Number
* scanFormat - String
* scanContent - String
* createdAt - Date
* updatedAt - Date
* ACL - ACL

## Comment
* objectId - String
* content - String
* brand - String
* rate - Number
* reputation - Number
* parent - Pointer<Item>
* createdBy - Pointer<User>
* scanContent - String
* createdAt - Date
* updatedAt - Date
* ACL - ACL

## Like
* objectId - String
* user - Pointer<User>
* comment - Pointer<Comment>
* like - Boolean
* createdAt - Date
* updatedAt - Date
* ACL - ACL


