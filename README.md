- nodejs-parsing-tool

- Run Database migration
- Run Database seed

- Load Edit Messages html
http://localhost:4000/


***
- In Production
- TODO: In Production to remove
- search 'TODO' Word in project
***



- To manually trigger adding new orders and add to database
http://localhost:4000/api/email/triggerEmailProcessing

- To manually trigger sending message to unprocess order
http://localhost:4000/api/email/triggerMessageSendingProcessing


- the processShopifyEmails function will run in every 6 hours will take new orders and put to database
- the triggerMessageSendingProcessing function will run in every 7 hours will get unprocessed order and send messages
