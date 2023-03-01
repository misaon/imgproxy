// import { getImageUrl } from '@misaon/imgproxy'
import { getImageUrl } from '../dist/index.mjs'

const imageUrl = getImageUrl('https://img.dog-learn.com/dog-breeds/maltese/maltese-sz5.jpg', {
    secret: '6F787973686F70',
    salt: '10D16F7A61',
    baseURL: '/imgproxy',
    modifiers: {
        width: 300,
        height: 250,
    }
})

console.log(imageUrl)
