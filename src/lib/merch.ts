export interface MerchItem {
  id: string;
  name: string;
  price: number;
  description: string;
  longDescription: string;
  badge?: string;
  src: string;
  backSrc?: string;
  thumbnails: string[];
  imagePosition?: string;
  features: string[];
}

const merchImagePairs = Array.from({ length: 12 }, (_, index) => {
  const number = index + 1;
  const backNumber = number === 10 ? 1 : number + 1;

  return {
    front: number === 10 ? '/Front.png' : number === 11 ? '/Front (10).png' : number === 12 ? '/Front (11).png' : `/Front (${number}).png`,
    back: number === 8 ? '/Back-BlackOC.png' : number === 11 ? '/Back (11).png' : number === 12 ? '/Back (12).png' : `/Back (${backNumber}).png`,
  };
});

const merchNames = [
  'Asian',
  'Long Sleeve',
  'Do You Want A Bashcut?',
  'Nobody Cares',
  'Worldwide',
  'Big B',
  'Rules The World',
  'Owners Club Black',
  'Wild West',
  'Y2K Star',
  'Owners Club Grey',
  'Stussy Inspired',
];

export const merchItems: MerchItem[] = merchImagePairs.map((images, index) => {
  const number = index + 1;
  const name = merchNames[index] ?? `BashCutz Tee ${number}`;

  return {
    id: `tee-${number}`,
    name,
    price: 400,
    description: 'Heavyweight cotton tee with front and back print.',
    longDescription:
      `The ${name} tee is a signature BASHCUTZ piece built for everyday wear, with a heavyweight feel and bold front-and-back branding.`,
    badge: number === 1 ? 'Best Seller' : undefined,
    src: images.front,
    backSrc: images.back,
    thumbnails: [images.front, images.back],
    features: [
      'Heavyweight cotton construction',
      'Front and back BASHCUTZ graphics',
      'Streetwear-inspired oversized feel',
      'Available by WhatsApp order',
    ],
  };
});

export const featuredMerchItems = merchItems.slice(0, 2);

export const getMerchItemById = (id: string) =>
  merchItems.find((item) => item.id === id);

export const createMerchWhatsAppLink = (item: MerchItem, size?: string) => {
  const message = encodeURIComponent(
    `Hello, I want to buy this BASHCUTZ merch item:\n\n` +
      `Product: ${item.name}\n` +
      `Price: R${item.price}\n` +
      (size ? `Size: ${size}\n` : '') +
      `\nPlease send me availability, sizes, and the next steps.`
  );

  return `https://wa.me/27607329632?text=${message}`;
};
