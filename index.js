#!/usr/bin/env node
const axios = require('axios')
const meow = require('meow')
var jsdom = require('jsdom')
const { JSDOM } = jsdom
const { window } = new JSDOM()

var $ = (jQuery = require('jquery')(window))

const createUrl = (location = '', differenceLocation = '') => {
  const baseUrl = 'http://www.google.com/search?q='
  return (
    baseUrl +
    (differenceLocation
      ? 'time+difference+in+' +
        location.replace(' ', '+') +
        '+from+' +
        differenceLocation.replace(' ', '+')
      : 'time+in+' + location.replace(' ', '+'))
  )
}

const makeRequest = options => axios(options).then(({ data }) => data)

const parseResult = searchingDifference => result => {
  if (searchingDifference) {
    const resultContainer = $($.parseHTML(result)).find('div.vk_c.vk_gy')
    const childDivs = resultContainer.find('div')
    const dates = $(childDivs.get(1))
    const difference = childDivs.get(0).textContent.trim()

    const first = {
      time: dates.find('b').get(0).textContent,
      day: dates.find('span').get(0).textContent,
      location:
        dates.find('div span').length > 1
          ? $(dates)
            .find('span')
            .get(1).textContent
          : $(dates)
            .html()
            .split(', ')[1]
            .split('<')[0]
            .trim()
    }

    const second = {
      time: dates.find('div b').get(0).textContent,
      day: dates.find('div span').get(0).textContent,
      location:
        dates.find('div span').length > 1
          ? $(dates)
            .find('div span')
            .get(1).textContent
          : $(dates)
            .html()
            .split(', ')[2]
            .split('<')[0]
            .trim()
    }

    const location = l => `, in ${l}`
    const formattedDateTime = `${difference}\n${first.time} ${
      first.day
    }${location(first.location)}\n${second.time} ${second.day}${location(
      second.location
    )}`

    return formattedDateTime
  } else {
    const resultContainer = $($.parseHTML(result)).find('div.vk_c.vk_gy')
    const spans = resultContainer.find('span')

    const time = resultContainer.find('div.gsrt').get(0).textContent
    const day = resultContainer
      .find('div.vk_gy')
      .get(0)
      .textContent.split(',')[0]
      .trim()
    const date = spans.get(0).textContent
    const timezone = spans.get(1).textContent.trim()
    const location = spans.get(2)
      ? spans.get(2).textContent.split('Time in ')[1]
      : ''
    const formattedDateTime = `${location}${location &&
      '\n'}${time} ${timezone}\n${day}, ${date}`
    return formattedDateTime
  }
}

const loopup = (location, difference, proxy) => {
  const url = createUrl(location, difference)
  const requestOptions = Object.assign(
    {
      url,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'
      }
    },
    proxy && { proxy }
  )

  return makeRequest(requestOptions).then(parseResult(difference))
}

const run = () => {
  const cli = meow(
    `
    Usage
        parsed timein <input>

    Options
        -d, --difference <"2nd loc">    (Requires quotes) Get the time difference between two locations
        -p, --proxy                     Set your proxy
        -h, --help                      Display helpful information
        -r, --remote                    Forces a remote search (don't use the local tz database)
`,
    {
      alias: {
        d: '--difference',
        p: '--proxy',
        h: '--help',
        r: '--remote'
      }
    }
  )

  const location = cli.input.join(' ')
  const difference = cli.flags.d
  const proxy = cli.flags.p

  loopup(location, difference, proxy).then(console.log)
}

run()
