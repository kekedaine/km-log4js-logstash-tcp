km-log4js-logstash-tcp
===============
This is a copy of the logstashUDP appender but instead sending via UDP send via TCP to avoid the maximum 64k bytes message size with the logstashUDP appender

Installation
------------
You can install install log4js-logstash-tcp by adding this .git url to your package.json or do a
```
npm i -S km-log4js-logstash-tcp
```

Usage: logstash configuration
-----------------------------
In the "input" part of the logstash server conf :

    input {
    	tcp {
    		codec => "json"
    		port => 5000
    	}
    }


Usage: log4js configuration
---------------------------
Plain javascript
```javascript
var log4js = require('log4js');
log4js.configure({
    appenders: {
        logstash: {
            type: 'km-log4js-logstash-tcp',
            host: 'localhost',
            port: 5000,
            service: {
                name: 'server_a',
                ip: '1.1.2.3',
                environment: process.env.NODE_ENV || 'development'
            }
        },
        console: { type: 'console' }
    },
    categories: {
        default: { appenders: ['logstash', 'console'], level: 'info' }
    }
});
var logger = log4js.getLogger();
logger.error("important log message", {id: 123, object2: { foo: 'bar', obj2: { foo: 123 } }, bar: 'dai10' });
```


