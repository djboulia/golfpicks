import { Component, OnInit } from '@angular/core';

import { NgxSpinnerService } from "ngx-spinner";

@Component({
    selector: 'app-base',
    template: `
    <p>
      base works!
    </p>
  `,
    styles: [
    ]
})

/**
 * Most of our pages have to start by loading one or more backend services,
 * requiring the UI to show a "loading" spinner until the network
 * calls complete. This base class manages the loading and error state
 * including showing/hiding the spinner
 * 
 * the inheriting templates can use the "isLoaded" and "errorMessage"  
 * instance variables to determine the current loading/error state
 */
export class BaseLoadingComponent {
    errorMessage: any = null;
    isLoaded = false;

    constructor(
        public baseSpinner: NgxSpinnerService
    ) { }

    /**
     * call this in the beginning of the inheriting class to set the
     * initial state and show the spinner
     */
    loading() {
        this.errorMessage = null;
        this.baseSpinner.show();
        this.isLoaded = false;
    }

    /**
     * call this to set an error state and reset the spinner
     * 
     * @param msg 
     */
    error(msg: string) {
        console.log(msg);

        this.errorMessage = msg;
        this.baseSpinner.hide();
        this.isLoaded = false;
    }

    /**
     * called when the load is complete. hides the spinner and 
     * sets the state to loaded
     */
    loaded() {
        this.baseSpinner.hide();
        this.isLoaded = true;
    }
}