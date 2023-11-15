# Node.js Practical

## The task of the topic "JWT"

Create a web application using Express.js, dotenv, jsonwebtoken, and bcrypt.  
The application should provide the functionality of authentication and authorization with JWT
The endpoints of the application with headers and examples of bodies are defined in *requests.rest* file. 

### Use *utils.js* as database substitute for this task (use *users, refreshTokens, posts* arrays).
#### Use jsonwebtoken *verify* with callback as the 3rd argument where this function is needed
#### Generated JWTs should contain *name* field with a value of the user's login
<img src="./.github/jwt-evample.png" width=450 >
  
User of our app should be able to: 
1. **sign up into the server (auth/signup)** if there is no user with the same username already signed up.  
  - in case of success  
      user info should be added to the *users* array in the form, 
      ``` 
      {
        name: username,
        password: hashedPassword, // note, that password should be hashed, use bcrypt for this
      } 
      ```   
      the response status should be 200,  
      the response body should be,
      ```
      {
        "result": "Signup is successful"
      }
      ```
  - in case of failure (if there is a user with such username signed up already) the response status should be 422 and the body:  
      ```
      {
        "errors": [
          {
            "msg": "This user already exists"
          }
        ]
      }
      ```
2. **log in to the server (auth/login)**  
  - in case of success - if login and password are correct (use bcrypt to compare hashed passwords)  
  the response status should be 200,    
  the body should have the next structure
    ```
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiU21pdGgiLCJpYXQiOjE2OTc3OTE0NDAsImV4cCI6MTY5Nzc5MTQ4NX0.NWGg2BXP4dDNqVL_kbD7z5MKcr8dT_w9GeAB5udLW3I",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiU21pdGgiLCJpYXQiOjE2OTc3OTE0NDB9.s6hMWA5zgyFhJ-2DX14Q9EeKecQvBx9C_fVcMCCDjM0"
    }  
    ```  
    and refresh token should be added to the *refreshTokens* array.  
    Use environment variables ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET for generating access and refresh tokens correspondingly  
  - if login or/and password are incorrect, the response status should be 404, and the body
    ```
    {
      "errors": [
        {
          "msg": "Invalid Credentials"
        }
      ]
    }  
    ```
3. **generating new token by refresh token: /auth/token**
  - in case of success the response status code should be 200 and the body  
    ```
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiU21pdGgiLCJpYXQiOjE2OTc3OTU1NjQsImV4cCI6MTY5Nzc5NTYwOX0.4eeenKoi8-pY39ru_Zy6DEgiH3_O_gA9xTWwcat_sa8"
    }
    ```
  - if no refresh token was provided, the response status code should be 401
  - if the refresh token was not found in the refreshTokens array, the response status code should be 403
  - if the refresh token is invalid, the response status code should be 403
4. **logging out from the system: /auth/token** - refresh token is sent in the body. 
  - 204 status code should be returned and the received refresh token should be removed from *refreshTokens* array
  
5. **/posts** - this resource should be available only to authenticated users. Authentication token is received in the 'Authorization' header, the next word after 'Bearer' and space (see example in request.rest file).
  - if the token is not received, the response status should be 401
  - if the token is not valid, the response status should be 403
  - in case of success the 200 status code should be used for response, and an array of all posts should be sent in the response body
6. **/posts/my** - this resource should be available only to authenticated users. Authentication token is received in 'Authorization' header, the next word after 'Bearer' and space.
  - if the token is not received, the response status should be 401
  - if the token is not valid, the response status should be 403
  - in case of success  
   the 200 status code should be used for response,   
   and an array of posts with author field equal to the name of this authenticated user, that is making the request, should be sent in the response body
7. **/posts/:id** - this resource should be available only to authenticated users. Authentication token is received in 'Authirization' header, the next word after 'Bearer' and space.
  - if author field of the requested post is not equal to the name of this authenticated user, that is making the request,  
  the response status code should be 403
  - if the token is not received, the response status should be 401
  - if the token is not valid, the response status should be 403
  - if there is no post with the specified id, the response status should be 404
  - in case of success  
   the 200 status code should be used for response,    
   and updated post should be sent in response body

   *Tip: you can use extention **REST Client** to be able to send requests from requests.rest file within VS Code :)*