const got = require('got')
const meow = require('meow')

const makeRequest = (url) => {
    got(url).then((result) => {
        const $ = result.body
        const location = $.split('<tr><td><a href=')[1].split('</a>')[0].split('>')[1]
        console.log(location)
    const answer = $.split('class=rbi>')[1].split('</td>')[0]
    console.log(answer)
    }).
        catch(err => {
            console.log('Error: No results found.')
    })
}

const cli = meow()
const url = 'http://www.timeanddate.com/worldclock/?query='
const query = cli.input[0] ? cli.input[0] : ''

makeRequest(url + query)