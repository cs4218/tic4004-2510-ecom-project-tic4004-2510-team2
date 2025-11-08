# localhost docker instance of mongodb setup
## Migration plan
As we are doing performance test on cloud db, we will face limitation as we are using free tier. With a local version of mongodb instance, this can be resolved.

### Dump your existing data using mongodump utility
```shell
mongodump --uri="mongodb+srv://db_admin:xxx@tic4004-cluster.gkmipra.mongodb.net/"
```


### Import your existing data using mongodump utility
```shell
mongorestore --uri="mongodb://db_admin:xxx@localhost:27017/" dump/
```

### Update your .env file to local instance of mongodb
```shell
MONGO_URL = mongodb://db_admin:xxx@localhost:27017/
```