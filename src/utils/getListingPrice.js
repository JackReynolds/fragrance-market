export default function getListingPrice(listing = {}) {
  const priceCents = Number(listing.priceCents);
  if (Number.isSafeInteger(priceCents) && priceCents >= 0) {
    return priceCents / 100;
  }

  const legacyPrice = Number(listing.price);
  return Number.isFinite(legacyPrice) && legacyPrice >= 0 ? legacyPrice : 0;
}
