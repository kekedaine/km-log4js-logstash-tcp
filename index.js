'use strict';

const net = require('net');
const util = require('util');

function sendLog(host, port, logObject) {
    const msg = JSON.stringify(logObject) + "\n";
    const tcp = net.connect({ host: host, port: port }, function () {
        tcp.write(msg);
        tcp.end();
        tcp.destroy();
    });

    tcp.on('error', function (evt) {
        console.error('An error happened while sending log line to logstash', evt);
    });
}


function logstashTCP(config, layout) {
    console.log('log4js - config = ', config);

    const type = config.logType ? config.logType : config.category;

    if (!config.fields) {
        config.fields = {};
    }

    function checkArgs(argsValue, logUnderFields) {
        if ((!argsValue) || (argsValue === 'both')) {
            return true;
        }

        if (logUnderFields && (argsValue === 'fields')) {
            return true;
        }

        if ((!logUnderFields) && (argsValue === 'direct')) {
            return true;
        }

        return false;
    }

    function log(loggingEvent) {
        const fields = {};
        console.log('config.fields = ', config.fields);
        Object.keys(config.fields).forEach((key) => {
            fields[key] = typeof config.fields[key] === 'function' ? config.fields[key](loggingEvent) : config.fields[key];
        });

        /* eslint no-prototype-builtins:1,no-restricted-syntax:[1, "ForInStatement"] */
        // if (loggingEvent.data.length > 1) {
        //     const secondEvData = loggingEvent.data[1];
        //     if ((secondEvData !== undefined) && (secondEvData !== null)) {
        //         Object.keys(secondEvData).forEach((key) => {
        //             fields[key] = secondEvData[key];
        //         })
        //         ;
        //     }
        // }
        fields.level = loggingEvent.level.levelStr;
        fields.category = loggingEvent.categoryName;
        console.log('log4js - loggingEvent = ', loggingEvent);
        const logObject = {
            '@version': '1',
            '@timestamp': (new Date(loggingEvent.startTime)).toISOString(),
            'service': config.service,
            // type: type,
            message: layout(loggingEvent)
        };



        // if (checkArgs(config.args, true)) {
        //     logObject.fields = fields;
        // }

        if (loggingEvent.data.length > 1) {
            const secondEvData = loggingEvent.data[1];

            if ((secondEvData !== undefined) && (secondEvData !== null)) {
                let extra_data = {}
                Object.keys(secondEvData).forEach((key) => {
                    // fields[key] = ;
                    try {
                        if(typeof secondEvData[key] === 'object'){
                            console.log('=== object');
                            extra_data[key] = JSON.stringify(secondEvData[key])
                        }else{
                            extra_data[key] = String(secondEvData[key])
                        }
                    } catch (error) {
                        console.log('refomat log data error: ', error);
                    }
                })
                logObject['extra_data'] = extra_data
            }
        }

        // if (checkArgs(config.args, false)) {
        //     Object.keys(fields).forEach((key) => {
        //         logObject[key] = fields[key];
        //     });
        // }

        sendLog(config.host, config.port, logObject);
    }

    log.shutdown = function (cb) {
        cb();
    };

    return log;
}

function configure(config, layouts) {
    let layout = layouts.dummyLayout;
    if (config.layout) {
        layout = layouts.layout(config.layout.type, config.layout);
    }

    return logstashTCP(config, layout);
}

module.exports.configure = configure;
