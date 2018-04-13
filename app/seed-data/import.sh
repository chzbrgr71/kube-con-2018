mongoimport --host $MONGODB_HOST --port $MONGODB_PORT --ssl --db $MONGODB_DBNAME --username $MONGODB_USERNAME --password $MONGODB_PASSWORD --collection subjects --type json --file ./subjects.json --jsonArray

mongoimport --host $MONGODB_HOST --port $MONGODB_PORT --ssl --db $MONGODB_DBNAME --username $MONGODB_USERNAME --password $MONGODB_PASSWORD --collection sites --type json --file ./sites.json --jsonArray

mongoimport --host $MONGODB_HOST --port $MONGODB_PORT --ssl --db $MONGODB_DBNAME --username $MONGODB_USERNAME --password $MONGODB_PASSWORD --collection ratings --type json --file ./ratings.json --jsonArray

mongoimport --host $MONGODB_HOST --port $MONGODB_PORT --ssl --db $MONGODB_DBNAME --username $MONGODB_USERNAME --password $MONGODB_PASSWORD --collection currentsite --type json --file ./currentsite.json --jsonArray