Express Facebook Boilerplate

Kinda simple, but I really needed a quick starter for the Node/Express/Facebook authentication stack. I used Redis as the backend, only because I haven't gotten familiar with any other database in Node, but I'll probably switch over to something more well-suited. Facebook authentication is provided by Passport, but you still have to pass in your own config.js file with a Facebook object inside of a config object, with the clientId and clientSecret properties set.
