# Education Chatbot (Dialogflow + Facebook Messenger) 

- **Create a facebook page and a facebook application.**  Linking the facebook application with the facebook page to get page access token 
- **Create an agent on Dialogflow with ```agent.zip``` file in agent folder.** 

- **Create server**

     Create a database with ```database.sql``` file in database folder. (and update information in ```database.js``` file, if needed)

     Run server  
     
        npm install -g nodemon

        npm install

        nodemon index.js


- **Setting webhook**

     Using ```ngrok``` tool to create a tunel between webhook of facebook application and your localhost by running this command: ```ngrok http 8080```

     Go to your facebook application. Click on “Setup Webhooks” and it will show you a popup window, where you’ll need to fill out the following:

     Callback URL: With your ngrok URL (using https url NOT http url)

     Verify Token: The string for validation that you already chose in your code

     Subscription Fields: Choose ```messages``` and ```messaging_postbacks```

- **Try to send something to your bot and enjoy**
