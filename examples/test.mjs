// import { getImageUrl } from '@misaon/imgproxy'
import { getImageUrl } from '../dist/index.mjs';

const imageUrl = getImageUrl(
	'https://img.dog-learn.com/dog-breeds/maltese/maltese-sz5.jpg',
	{
		secret: '6F787973686F70',
		salt: '10D16F7A61',
		baseURL: '/imgproxy',
		modifiers: {
			width: 300,
			height: 250,
		},
	},
);

console.log(imageUrl);
// Output: /imgproxy/3mqw14PjyZJLm2__0RNPEDZcX8NLtLZkURz1MfoCTm4/h:250/w:300/aHR0cHM6Ly9pbWcuZG9nLWxlYXJuLmNvbS9kb2ctYnJlZWRzL21hbHRlc2UvbWFsdGVzZS1zejUuanBn
