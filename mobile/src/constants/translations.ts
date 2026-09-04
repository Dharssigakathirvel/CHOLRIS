/**
 * CHLORIS Centralized Translation Dictionary
 * ===========================================
 * English and Tamil strings for the Farmer Dashboard.
 */

export type Language = 'en' | 'ta';

export const TRANSLATIONS = {
  en: {
    greeting: 'Welcome 👋',
    myFarm: 'My Farm',
    logout: 'Logout',
    fieldStatus: 'FIELD STATUS',
    online: 'ONLINE',
    offline: 'OFFLINE',
    gettingFieldData: 'Getting field data…',
    unableToGetFieldData: '⚠️ Unable to get latest field data.',
    checkInternet: 'Please check your internet connection.',

    cropHealthLabel: 'CROP HEALTH',
    cropHealthGood: 'Your crop is doing well',
    cropHealthAttention: 'Attention required for crop',
    cropHealthCritical: 'Crop condition is critical',

    todaysFieldStatus: "Today's Field Status",
    water: 'WATER',
    weather: 'WEATHER',
    pestRisk: 'PEST RISK',
    disease: 'DISEASE',

    waterOk: 'WATER OK',
    irrigationNeeded: 'IRRIGATION NEEDED',
    irrigateNow: 'IRRIGATE NOW',
    monitor: 'MONITOR',

    todaysRecommendation: "Today's Recommendation",
    waterNeededBody: 'Soil moisture is low. Water the field today.',
    criticalBody: 'Conditions are critical. Inspect the field immediately.',
    attentionBody: 'Monitor field conditions closely today.',
    goodBody: 'Continue regular monitoring.',

    fieldMapAndWeather: 'Field Map & Weather',
    locationPermissionTitle: 'Field Location Access',
    locationPermissionExplanation: 'CHLORIS uses your field location to show the local weather and display your field on the map.',
    locationPermissionDenied: 'Location permission is needed for live weather and map.',
    grantPermission: 'Grant Location Access',
    temperature: 'Temperature',
    humidity: 'Humidity',
    rainProbability: 'Rain',
    windSpeed: 'Wind',
    updatedJustNow: 'Updated just now',
    updatedAgo: (min: number) => `Updated ${min} min ago`,
    weatherUnavailable: 'Weather temporarily unavailable',
    refresh: 'Refresh',
    field01Marker: 'FIELD01 (CHLORIS Field)',
    languagePrompt: 'Choose your preferred language',
  },
  ta: {
    greeting: 'வணக்கம் 👋',
    myFarm: 'என் பண்ணை',
    logout: 'வெளியேறு',
    fieldStatus: 'வயல் நிலை',
    online: 'இணைக்கப்பட்டது',
    offline: 'இணைப்பில்லை',
    gettingFieldData: 'வயல் தரவு பெறப்படுகிறது…',
    unableToGetFieldData: '⚠️ சமீபத்திய வயல் தரவைப் பெற முடியவில்லை.',
    checkInternet: 'இணைய தொடர்பை சரிபார்க்கவும்.',

    cropHealthLabel: 'பயிர் நிலை',
    cropHealthGood: 'உங்கள் பயிர் நன்றாக உள்ளது',
    cropHealthAttention: 'பயிருக்கு கவனிப்பு தேவை',
    cropHealthCritical: 'பயிர் நிலை மிகவும் மோசமாக உள்ளது',

    todaysFieldStatus: 'இன்றைய வயல் நிலை',
    water: 'தண்ணீர்',
    weather: 'வானிலை',
    pestRisk: 'பூச்சி ஆபத்து',
    disease: 'நோய்',

    waterOk: 'தண்ணீர் நிலை சரி',
    irrigationNeeded: 'தண்ணீர் தேவை',
    irrigateNow: 'இப்போதே தண்ணீர் பாய்ச்சவும்',
    monitor: 'கவனியுங்கள்',

    todaysRecommendation: 'இன்றைய பரிந்துரை',
    waterNeededBody: 'மண்ணில் ஈரப்பதம் குறைவு. இன்று தண்ணீர் பாய்ச்சவும்.',
    criticalBody: 'நிலைமை தீவிரமாக உள்ளது. உடனே வயலை பார்வையிடவும்.',
    attentionBody: 'இன்று வயல் நிலையை கவனமாக கண்காணிக்கவும்.',
    goodBody: 'வழக்கமான கண்காணிப்பை தொடரவும்.',

    fieldMapAndWeather: 'வயல் வரைபடம் & வானிலை',
    locationPermissionTitle: 'வயல் இருப்பிட அணுகல்',
    locationPermissionExplanation: 'உங்கள் வயலுக்கான உள்ளூர் வானிலையையும் வரைபடத்தையும் காட்ட CHLORIS உங்கள் வயல் இருப்பிடத்தைப் பயன்படுத்துகிறது.',
    locationPermissionDenied: 'நேரலை வானிலை மற்றும் வரைபடத்திற்கு இருப்பிட அனுமதி தேவை.',
    grantPermission: 'இருப்பிட அணுகலை அளிக்கவும்',
    temperature: 'வெப்பநிலை',
    humidity: 'ஈரப்பதம்',
    rainProbability: 'மழை',
    windSpeed: 'காற்று',
    updatedJustNow: 'இப்போது புதுப்பிக்கப்பட்டது',
    updatedAgo: (min: number) => `${min} நிமிடங்களுக்கு முன் புதுப்பிக்கப்பட்டது`,
    weatherUnavailable: 'வானிலை தற்காலிகமாக கிடைக்கவில்லை',
    refresh: 'புதுப்பி',
    field01Marker: 'FIELD01 (குளோரிஸ் வயல்)',
    languagePrompt: 'உங்களுக்கு விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்',
  },
} as const;
