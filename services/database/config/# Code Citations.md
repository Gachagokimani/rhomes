# Code Citations

## License: unknown
https://github.com/Marichka0701/Hubstudy/tree/6ce1338a2688f944ff2d2083fa01e50ae2b34f88/server/controllers/lesson.js

```
, res) => {
  try {
    let query;
    const reqQuery = { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param
```


## License: unknown
https://github.com/praspit/SWPractice/tree/19eb24aa53d3d35318d807f2fd32784dd393461d/controller/hospitals.js

```
=> {
  try {
    let query;
    const reqQuery = { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);
```


## License: unknown
https://github.com/mimoriam/devcamper_proj_api/tree/4c06bda14e5016934bafee5b53a44ca1514e0485/controllers/bootcamps.js

```
= { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);
    let queryStr = JSON.stringify(reqQuery);
```


## License: unknown
https://github.com/juacorsa2012/api-recursos/tree/38638f0b35b568f9c0cf78f7e19b48a5631893d8/middleware/advancedQuery.js

```
..req.query };
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr
```


## License: unknown
https://github.com/remoschaer86/devcamper-api/tree/3d69a187616b87cc6b7713cffe0499586632f489/middleware/advancedResults.js

```
;
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b
```

