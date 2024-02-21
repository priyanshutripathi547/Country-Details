import { Component, OnInit, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  startWith,
  map,
} from 'rxjs/operators';

interface CountryDetails {
  capital: string;
  currencies: {
    name: string;
    symbol: string;
  }[];
}

interface WeatherDetails {
  weather: {
    description: string;
  }[];
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  wind: {
    speed: number;
  };
}

@Component({
  selector: 'app-country-details',
  templateUrl: './country-details.component.html',
  styleUrls: ['./country-details.component.scss']
})
export class CountryDetailsComponent implements OnInit {

  countryDetails!: CountryDetails;
  temperature!: number;
  windSpeed!: number;
  humidity!: number;
  pressure!: number;
  weatherDetails!: WeatherDetails;
  currencyName!: string;
  currencyCode!: string;
  exchangeRate!: number;
  imageUrl!: string;

  // Autocomplete variables
  countries: string[] = [];
  filteredCountries: any;
  countryControl = new FormControl();

  constructor(private http: HttpClient, private ngZone: NgZone) {
    this.fetchAllCountries();
  }

  ngOnInit(): void {
    this.filteredCountries = this.countryControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  fetchAllCountries() {
    this.http.get<any>('https://countriesnow.space/api/v0.1/countries')
      .subscribe(
        (response: any) => {
          if (Array.isArray(response.data)) {
            this.countries = response.data.map((country: any) => country.country);
          } else {
            console.error("Error: Data is no an array");
          }
        },
        (error: any) => {
          console.error("Error fetching contries:", error);
        }
      );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.countries.filter(country => country.toLowerCase().includes(filterValue));
  }

  fetchCountryAndWeatherDetails() {
    const apiKey = 'uTqi63kdsLBqz1Vml4dQrA==Cypmw263IOmp7l5t'; // Replace with your actual API key
    const url = `https://api.api-ninjas.com/v1/country?name=${this.countryControl.value}`;
    const headers = new HttpHeaders({
      'X-Api-Key': apiKey
    });
    this.http.get<any>(url, { headers: headers })
      .subscribe(countryInfo => {
        this.countryDetails = countryInfo[0];
        const currencyCode = countryInfo[0].currency.code;
        this.currencyName = countryInfo[0].currency.name;
        const weatherDetails$ = this.http.get(`https://api.openweathermap.org/data/2.5/weather?q=${this.countryControl.value}&appid=b2aa0b621bb31b6bc32c9387db715edf&units=metric`);
        weatherDetails$.subscribe((weatherData:any) => {
          this.weatherDetails = weatherData.weather[0].description;
          this.temperature = weatherData.main.temp;
          this.windSpeed = weatherData.wind.speed;
          this.humidity = weatherData.main.humidity;
          this.pressure = weatherData.main.pressure;
          this.detectBrowserLocation(currencyCode);
        });
      });

      // this.fetchImageUrl();
    // });
  }

  fetchImageUrl() {
    // Fetch image URL from Unsplash based on the weather keyword
    this.http.get<any>(`https://api.unsplash.com/photos/random?query=${this.weatherDetails}&client_id=MQZM22fRISgS29q4gU0irL23RnMw8GN75nevKxx3LOQ`)
      .subscribe(data => {
        this.imageUrl = data.urls.regular; // Use the 'regular' size image URL from Unsplash
      });
  }

  detectBrowserLocation(currencyCode: string) {
    this.ngZone.runOutsideAngular(() => {
      navigator.geolocation.getCurrentPosition((position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const apiKey = 'efd71fd8a8174a179ce1d95f1a93dd97';
        const url = `https://api.geoapify.com/v1/geocode/reverse?style=full&lat=${latitude}&lon=${longitude}&apiKey=${apiKey}`;
        this.http.get(url).subscribe((response: any) => {
          const countryCode = response.features[0].properties.country;
          const apiKey = 'uTqi63kdsLBqz1Vml4dQrA==Cypmw263IOmp7l5t'; // Replace with your actual API key
          const url = `https://api.api-ninjas.com/v1/country?name=${countryCode}`;
          const headers = new HttpHeaders({
            'X-Api-Key': apiKey
          });
          this.http.get<any>(url, { headers: headers })
            .subscribe(countryInfo => {
              const currencyCodeBase = countryInfo[0].currency.code;
            this.fetchExchangeRate(currencyCode, currencyCodeBase);
            });
        });
      });
    });
  }

  fetchExchangeRate(currencyCode: string, currencyCodeBase: string) {
    this.http.get<any>(`https://api.exchangerate-api.com/v4/latest/${currencyCodeBase}`)
      .subscribe(data => {
        this.exchangeRate = data.rates[currencyCode];
       
     });
  }


}
