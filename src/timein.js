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
`, {
    alias: {
        d: '--difference',
        p: '--proxy',
        h: '--help'
    }
})

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