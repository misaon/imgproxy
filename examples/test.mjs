// import { getImageUrl } from '@misaon/imgproxy'
import { getImageUrl } from '../dist/index.mjs'

const imageUrl = getImageUrl('http://object-storage:9000/oxyshop-nextgen/media/image/e9/77/151f15b8f9af244f7f61775ddb3d.png', {
  secret: '6F787973686F70', salt: '10D16F7A61', baseURL: '/imgproxy',  modifiers: {
    width: 768,
    height: 0,
  }
})

console.log(imageUrl)
