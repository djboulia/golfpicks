//
// wrap a basic REST request over HTTP and format in/out values in JSON
//
export class JsonRequest {
  constructor(private url: string) {}

  async get() {
    const result = await fetch(this.url).catch((error) => {
      console.log('Error!: ' + error);
      throw error;
    });

    if (!result.ok) {
      const errorText = await result.text();
      console.log('JsonRequest error: ' + errorText);
      throw new Error(errorText);
    }

    const json = (await result.json()) as unknown;
    return json;
  }

  async post(data: unknown) {
    const result = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).catch((error) => {
      console.log('Error!: ' + error);
      throw error;
    });

    if (!result.ok) {
      const errorText = await result.text();
      console.log('JsonRequest error: ' + errorText);
      throw new Error(errorText);
    }

    const json = (await result.json()) as unknown;
    return json;
  }
}
