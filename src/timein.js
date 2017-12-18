#!/usr/bin/env node
const request = require('request')
const meow = require('meow')


const createUrl = (url, { input, flags }) => {
    try {
        input = input.join('+')
        return url + (flags.d ? 'difference+in+' + input + '+from+' + flags.d.replace(' ', '+') : 'in+' + input)
    } catch (exception) {
        cli.showHelp()
    }
}

const makeRequest = (options, { d: difference }) => {
    request(options, (err, status, result) => {
        try {
            if (err) {
                console.log('No results found.')
            } else {
                if (difference) {
                    const $ = result.split('<div class="_RZc vk_bk vk_ans">   ')[1].split('</div></div>')[0]
                    const difference = $.split('   </div>')[0]

                    const firstTime = $.split('<b>')[1].split('</b>')[0]
                    let firstDate = $.split('<span class="_Hq">')[1].split('</span> is')[0]
                        .replace('<span class="_gje">', '')
                        .replace('</span>', '')

                    const secondTime = $.split('<b>')[2].split('</b>')[0]
                    let secondDate = $.split('<span class="_Hq">')[2].split('</span></div>')[0]
                        .replace('<span class="_gje">', '')
                        .replace('</span>', '')

                    console.log(`${difference}\n${firstTime} ${firstDate}\n${secondTime} ${secondDate}`)
                } else {
                    const $ = result.split('<div class="vk_bk vk_ans">')[1].split('</div> </div></div>')[0]
                    const location = $.split('<span>  Time in ')[1].split(' </span>')[0]
                    const time = $.split('</div>')[0]
                    let date = $.split('<div class="vk_gy vk_sh"> ')[1].split('</div>')[0]
                        .replace('<span class="_Hq">', '')
                        .replace('  <span class="_Hq">', '')
                        .replace('</span>', '').replace('</span>', '')

                    console.log(`${location}\n${time} ${date}`)
                }
            }
        } catch(exception) {
            cli.showHelp()
        }
    })
}

const cli = meow(`
    Usage
        $ timein <input>

    Options
        -d, --difference <"2nd loc">    (Requires quotes) Get the time difference between two locations
        -p, --proxy                     Set your proxy
        -h, --help                      Display helpful information
        -r, --remote                    Forces a remote search (don't use the local tz database)
`, {
    alias: {
        d: '--difference',
        p: '--proxy',
        h: '--help',
        r: "--remote"
    }
})

const remoteLookup = (cli) => {
    const url = createUrl('http://www.google.com/search?q=time+', cli)
    const options = Object.assign(
        {
            url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'
            }
        },
        cli.flags.p && { proxy: cli.flags.p }
    )

    makeRequest(options, cli.flags)
}

const moment = require("moment-timezone")

const showTimeForZone = (zone) => {
    var date = moment().tz(zone)
    formatAndDisplayDate(date, zone)
    return true
}

const formatAndDisplayDate = (date, zone) => {
    var time = date.format("LT dddd, LL Z")
    var location = zone.split("/").reverse().join(", ")
    console.log(`${location} \n${time}`)
    return true;
}

const localLookup = (cli) => {
    var {input, flags} = cli

    // Local Lookup doesn't support options
    if(Object.keys(flags).length !== 0) {
        return false;
    }

    const tz = moment.tz;

    var found = {};
    
    // Try to build a timezone name
    for(var name in tz._names) {
        var zone = tz._names[name];
        
        var zone_components = zone.toLowerCase().split("/")
        var name_components = name.toLowerCase().split("_")

        var combined_components = zone_components.concat(name_components);

        var matches = 0.0;

        for(var i in input) {
            var key = input[i].toLowerCase();

            if(combined_components.indexOf(key) !== -1) {
                matches += 1.0;
            }

            for(var i in combined_components) {
                var component = combined_components[i];
                if(component.indexOf(key) !== -1) {
                    matches += (parseFloat(key.length) / parseFloat(component.length))
                    break;
                }

            }
        }

        if(matches !== 0.0) {
            found[zone] = matches;
        }
    }

    if(Object.keys(found).length === 0) {
        return false;
    }

    var topZone = false;
    var topZoneScore = 0;

    for(var zone in found) {
        var score = found[zone];
        if(score > topZoneScore && score > 1.0) {
            topZone = zone;
            topZoneScore = score;
        }
    }    

    if(topZone === false) {
        return false;
    }

    return showTimeForZone(topZone);
}

var result = localLookup(cli);

if(!result) {
    remoteLookup(cli);
}