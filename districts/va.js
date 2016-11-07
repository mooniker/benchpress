'use strict'

const req = require('request')
const request = require('request-promise')
const cheerio = require('cheerio')
const path    = require('path')


// Virginia Supreme Court's webiste containing slip opinion info
const url = 'http://www.courts.state.va.us/scndex.htm'
const supCourt = 'http://www.courts.state.va.us/scndex.htm'


const appealsCourtName = 'Court of Appeals of Virginia'

const jurisdiction = {
    name: 'Virginia',
    code: 'VA',
}

// Court of Appeals of Virginia Published Opinions
const appealCourtPub = 'http://www.courts.state.va.us/wpcap.htm'

// Court of Appeals of Virginia Unpublished Opinions
const appealCourtUnpub = 'http://www.courts.state.va.us/wpcau.htm'


function scrapeVaCourt(url, meta) {
    return request(url).then((html) => {

        // Initialize Cheerio with requested HTML
        let $ = cheerio.load(html) // allows DOM transversal jQuery-style on $

        let $opinions = $('p').slice(2) // get all p elements, discard first two
        $opinions = $opinions.slice(0, $opinions.length - 2) // discard footer

        let jsons = []; // initialize array for collecting all our JSONs

        for ( let p = 0; p < $opinions.length; p += 1 ) {

            // Grab all text inside p element
            let pContent = $opinions.eq(p).text();

            // Grab text inside b element (bold tags)
            let caseName = $opinions.eq(p).find('b').text();

            // Grab the first word in the text (and assume it's a docket)
            let docketNumber = pContent.trim().split(' ')[0];

            // Split text on line break and assume the second part is summary
            let summary = pContent.split('\n')[1].trim();

            // Split text on line break and assume first part is meta info
            let metaInfo = pContent.split('\n')[0].trim();
            // Grab the last word in meta info and assume it's the date
            let date = metaInfo.split(' ')[metaInfo.split(' ').length - 1];

            // Find all the a elements that have an href attribute
            let $aWithHrefs = $opinions.eq(p).find('a[href]');
            let hrefs = []; // compile the href json in this

            // iterate through all the a[href] elements and extract the link info
            for ( let a = 0; a < $aWithHrefs.length; a += 1 ) {
                hrefs.push({
                    name: $aWithHrefs.eq(a).text(),
                    href: path.join( path.dirname(url), $aWithHrefs.eq(a).attr('href') )
                });
            }
            console.log(meta.courtName, caseName, date)

            jsons.push({
                meta: meta,
                caseName: caseName.trim(),
                docketNumber: docketNumber,
                dateString: date,
                docketDate: `${meta.jurisdiction.code} ${docketNumber} ${date}`, //docketNumber + ' ' + date,
                summary: summary,
                hrefs: hrefs,
            // content: pContent // let's just push the contents of each p into JSON
            })
        }

        return jsons

    })
}

exports.supremeCourt = () => {
    return scrapeVaCourt(url, {
        courtName: 'Supreme Court of Virginia',
        jurisdiction: jurisdiction,
        srcHref: url,
    })
}

exports.appealCourt = {
    published: () => {
        return scrapeVaCourt(appealCourtPub, {
            isPublished: true,
            courtName: appealsCourtName,
            jurisdiction: jurisdiction,
            srcHref: appealCourtPub
        })
    },
    unpublished: () => {
        return scrapeVaCourt(appealCourtUnpub, {
            isPublished: false,
            courtName: appealsCourtName,
            jurisdiction: jurisdiction,
            srcHref: appealCourtUnpub,
        })
    }
}

// exports.courts = function () {}
