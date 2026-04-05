export interface DayForecast {
  date: string;
  high: number;
  iconCode: string;
  description: string;
}

interface OpenWeatherItem {
  dt_txt: string;
  main: {
    temp_max: number;
  };
  weather: Array<{
    icon: string;
    description: string;
  }>;
}

interface OpenWeatherResponse {
  list: OpenWeatherItem[];
}

export async function getWeeklyForecast(lat: number, lng: number): Promise<DayForecast[]> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  if (!apiKey) {
    return [];
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    appid: apiKey,
    units: 'imperial',
  });

  const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load weather forecast.');
  }

  const json = (await response.json()) as OpenWeatherResponse;
  const forecastByDay = new Map<string, DayForecast>();

  for (const item of json.list ?? []) {
    const date = item.dt_txt.slice(0, 10);
    const current = forecastByDay.get(date);
    const nextHigh = Math.round(item.main.temp_max);
    const nextWeather = item.weather[0];

    if (!current || nextHigh > current.high) {
      forecastByDay.set(date, {
        date,
        high: nextHigh,
        iconCode: nextWeather?.icon ?? '01d',
        description: nextWeather?.description ?? 'Clear',
      });
    }
  }

  return Array.from(forecastByDay.values()).sort((a, b) => a.date.localeCompare(b.date));
}
