export function getBoundingBox(
	lat: number,
	lng: number,
	distanceInMeters: number = 50,
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
	const latRad = (lat * Math.PI) / 180;
	const radius = 111319; // meters per degree of latitude

	const latDelta = distanceInMeters / radius;
	const lngDelta = distanceInMeters / (radius * Math.cos(latRad));

	return {
		minLat: lat - latDelta,
		maxLat: lat + latDelta,
		minLng: lng - lngDelta,
		maxLng: lng + lngDelta,
	};
}

export function calculateHaversineDistance(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number,
): number {
	const toRad = (degrees: number) => (degrees * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);

	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return 6371000 * c; // Earth radius in meters
}
