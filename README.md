# Money Jars

## View it Live
https://money-jars.herokuapp.com/

## Client-side
https://github.com/Carenelizabeth/money-jars-client

## Motivation
I have been using a zero-based budgeting software called YNAB (You Need a Budget) for almost two years now and it has changed my life for the better. I keep track of less-frequent expenses and always have money set aside for when the car needs an oil
change or my son breaks his glasses for the 5th time in a year.

I've been trying to teach my kids the same money habits that I have learned and give them allowance so that they can practice
budgeting now. We've used jars and envelope systems but I was getting really tired of always needing to have the correct amount
of cash on hand. When YNAB announced its new public API, I decided it was time to do something about it

## Summary
With Money Jars, parents set up an account and can choose to link it to YNAB or budget manually. They then register their children. Children can create and save for goals, moving money between their goals and make a withdrawal when they are ready for
a purchase (you'll have to be on hand to give them actually money for that part)

## Learning Experiences
This was my first experience with Oauth and using the server as a proxy-router. It added a whole other level of challenge to creating this app, but also made it a lot more fun

## Technologies
* **backend** Node.js Express
* **testing** Mocha/Chai
* **databse** MongoDB Mongoose
* **integration** TravisCI