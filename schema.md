## relink order info

relink_orders
-----------------
id
orderNum
orderTotal
<!-- 
customerName
phone
email
billingAddress
shippingAddress -->  -> customerId
isItalian
orderStatus       // "new" | "domain-created" | "sent-for-shipping"
warehouseEmail


relink_domains
--------------
id
isActive
domain
sku
redirectUrl
createdBy

order_products
-----------------
id
relinkOrderId     // relink_orders table
productName
productSize
surfaceType
productSku
productQuantity
productPrice
businessUrlType
businessUrl
thirdLvlDomainId     // relink_domains table    

user
----------------
id
email
password
username
role

customer
---------------
id
name
email
aemail
phone
shippingAddress
billingAddress
userId
addedBy      // parsing | admin

customer_products
------------------
id
customerId
thirdLvlDomainId     // relink_domains table  
isPrimary
productSize
surfaceType
productSku


warehouse_setup
-------------------
id
name
email
parsingName
useLandingFlow      // boolean

// for shopify email, same table will be used

parsing_conditions
----------------------
id
condType        // address | mail-subject
condValue
warehouseId       // warehouse_setup table

cron_settings
-----------------
id
startCron       // boolean
scheduleIntervalInMins
processType     // "shopify" | "relink  (unique)
delayAfterMessageFetchInMins
isRunning       // boolean
useGoogleSheets
sheetsUrl

-- migration queries
```
-- insert sku
INSERT INTO public.sku(
	sku)
	select distinct("sku") from "relink_domains"
	where "relink_domains".sku <> '';

-- update domains
	update "relink_domains"
	set "skuId" = (
		select id from "sku"
		where "sku".sku = relink_domains.sku
	)
    
-- check
	select * from relink_domains inner join sku on sku.id = relink_domains."skuId";
	select * from sku;
	
	
	--check
	select * from "relink_domains"
	where "redirectUrl" ilike 'https://shop-manager.schedy.app/home%'
	and "isActive" = false
	
	-- update
	update "relink_domains"
	set "redirectType" = 'landing2'
	where "redirectUrl" ilike 'https://shop-manager.schedy.app/home%'
	and "isActive" = false
	
	update "relink_domains"
	set "redirectType" = 'landing1'
	where "createdBy" = 'user'
	and "redirectType" is null

	update warehouse_setup
	set "channelType" = 'shopify'
	where id = '717de5a2-dde2-4321-8cac-f66c13b14789'

	-- update user phone after adding phone field in user table
	UPDATE "user" AS u
SET "phone" = (
    SELECT c.phone 
    FROM customers AS c
    WHERE c."userId" = u.id
    AND c.phone <> ''
    LIMIT 1
);

-- warehouse templates
update "message"
set key=(select id from warehouse_Setup where name = 'Relink Italy' limit 1)
where key='MESSAGE_WAREHOUSE_LANDING_FLOW';

update "message"
set key=(select id from warehouse_Setup where name = 'Relink Germany' limit 1)
where key='MESSAGE_WAREHOUSE_NON_LANDING_FLOW';

```