#!/usr/bin/env node
const request = require('request')
const meow = require('meow')

const makeRequest = (options) => {
    request(options, (err, status, result) => {
        if (err) {
            console.log('No results found.')
        } else {
            const $ = result.split('<div class="_rkc _Peb">')[1].split('</div></div></div>')[0]
            const location = $.split('<span class="_HOb _Qeb">   Time in ')[1].split(' </span>')[0]
            const time = $.split('</div>')[0]
            let date = $.split('<div class="_HOb _Qeb"> ')[1].split('</div>')[0]
            date = date.replace('<span style="white-space:nowrap">', '').replace('</span>', '')
            console.log(`${location}\n${time} ${date}`)
        }
    })
}

const cli = meow(`
    Usage
        $ timein <input>

    Options
        -p, --proxy             Set your proxy
        -h, --help              Display helpful information
`, {
    alias: {
        p: '--proxy',
        h: '--help'
    }
})

const url = 'http://www.google.com/search?q=time+in+' + (cli.input[0] ? cli.input.join('+') : '')
const options = Object.assign(
    {},
    { url },
    cli.flags.p && { proxy: cli.flags.p }
)

makeRequest(options)