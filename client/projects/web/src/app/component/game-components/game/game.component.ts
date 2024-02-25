import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { TemplateRef } from '@angular/core';
import { NgbDateAdapter, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';

import { NgxSpinnerService } from 'ngx-spinner';
import { BaseLoadingComponent } from '../../base.loading.component';

import { CustomAdapter, CustomDateParserFormatter } from './datepicker.adapter';

import { mergeMap, map, catchError, throwError } from 'rxjs';

import { GameService } from '../../../shared/services/backend/game.service';
import { CourseService } from '../../../shared/services/backend/course.service';
import { EventService } from '../../../shared/services/backend/event.service';

import { Game } from '../../../shared/services/backend/game.interfaces';
import { Course } from '../../../shared/services/backend/course.interface';
import { Event } from '../../../shared/services/backend/event.interfaces';

import { DateHelperService } from '../../../shared/services/date/date-helper.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],

  // NOTE: For this example we are only providing current component, but probably
  // NOTE: you will want to provide your main App Module
  providers: [
    { provide: NgbDateAdapter, useClass: CustomAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class GameComponent extends BaseLoadingComponent implements OnInit {
  id: any = null;
  game: Game;
  event: any = null;
  courses: Course[] = [];
  schedule: any = null;
  selectedTourStop: any = null;
  selectedCourse: any = null;

  parentUrl = '/component/games';
  baseUrl = '/component/';

  title = '';
  deleteButton = false;
  submitButton = '';
  confirmButton = 'Confirm';

  constructor(
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private gameApi: GameService,
    private courseApi: CourseService,
    private eventApi: EventService,
  ) {
    super(spinner);
    this.game = gameApi.newModel();
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    console.log(`id: ${this.id}`);

    this.loading();

    if (this.id) {
      // edit an existing game
      const self = this;

      this.title = 'Update Game';
      this.deleteButton = true;
      this.submitButton = 'Save';

      this.loadExistingGame();
    } else {
      this.title = 'New Game';
      this.deleteButton = false; // no delete button when creating a new game
      this.submitButton = 'Create';

      this.loadNewGame();
    }
  }

  loadExistingGame() {
    // go get our game information from multiple sources
    this.gameApi
      .get(this.id)
      .pipe(
        map((game) => (this.game = game)),
        // map((data) => { console.log('found game ', data); return data; }),

        // get event that corresponds to this game
        mergeMap((game) => this.eventApi.deep(game.event, false)),
        map((event) => (this.event = event)),
        // map((data) => { console.log('found event ', data); return data; }),

        // get tour schedule for the appropriate season
        mergeMap((event) => this.eventApi.tourSchedule(event.season)),
        map((schedule) => (this.schedule = schedule)),
        // map((data) => { console.log('found tour schedule ', data); return data; }),

        // get the list of courses to choose from for this game
        mergeMap(() => this.courseApi.getAll()),
        map((courses) => (this.courses = courses)),
        // map((data) => { console.log('found courses ', data); return data; }),

        catchError((err) => this.loadingError('Error loading game!', err)),
      )
      .subscribe((data) => {
        this.selectedCourse = this.findCourse(this.event, this.courses);
        this.selectedTourStop = this.findTourStop(this.event, this.schedule);

        this.loaded();
      });
  }

  loadNewGame() {
    // create a new game
    this.game = this.gameApi.newModel();
    this.event = this.eventApi.newModel();

    // get the list of courses to choose from for this game
    this.courseApi
      .getAll()
      .pipe(
        map((data) => (this.courses = data)),
        map((data) => {
          console.log('found courses ', data);
          return data;
        }),

        // get tour schedule for the appropriate season
        mergeMap(() => this.eventApi.tourSchedule(this.event.season)),
        map((data) => (this.schedule = data)),
        map((data) => {
          console.log('found schedule ', data);
          return data;
        }),

        catchError((err) => this.loadingError('Error creating game!', err)),
      )
      .subscribe(() => {
        this.selectedCourse = this.courses[0];
        // new game, just set to first tour stop by default
        this.selectedTourStop = this.schedule[0];
        this.OnTourStopChanged(this.selectedTourStop);

        this.loaded();
      });
  }

  findTourStop(event: any, schedule: any): any {
    let stop = undefined;

    const id = event.tournament_id;
    console.log('id ', id);

    if (id) {
      for (let i = 0; i < schedule.length; i++) {
        const item = schedule[i];

        if (item.tournament_id === id) {
          stop = item;
          console.log('found tour stop: ', stop);
          break;
        }
      }
    }

    return stop;
  }

  findCourse(event: any, courses: any): any {
    let course = undefined;

    const rounds = event.rounds;
    console.log('rounds ', rounds);

    if (rounds.length > 0) {
      const courseid = rounds[0].course.id;

      console.log('looking for courseid ' + JSON.stringify(courseid));

      for (let i = 0; i < courses.length; i++) {
        //                console.log("found course: " + JSON.stringify(courses[i]));

        if (courses[i].id === courseid) {
          course = courses[i];
          console.log('found course: ', course);
          break;
        }
      }
    }

    return course;
  }

  /**
   * When the course drop down is changed, update our game start
   * and end dates to match
   *
   * @param tourstop
   */
  OnTourStopChanged(tourstop: any) {
    // tourstop is stored in UTC time, adjust for local time
    const startDate = new Date(tourstop.start);
    // console.log('tz offset ', startDate.getTimezoneOffset());
    const startTimeOffset = startDate.getTime() + startDate.getTimezoneOffset() * 60 * 1000;

    const endDate = new Date(tourstop.end);
    // console.log('tz offset ', endDate.getTimezoneOffset());
    const endTImeOffset = endDate.getTime() + endDate.getTimezoneOffset() * 60 * 1000;

    const start = new DateHelperService(startTimeOffset);
    const end = new DateHelperService(endTImeOffset);

    console.log('tourstop start: ' + tourstop.start + ' , ' + start.dateTimeString());
    console.log('tourstop end: ' + tourstop.end + ' , ' + end.dateTimeString());

    this.game.start = new Date(start.get()).toUTCString();
    this.game.end = new Date(end.get()).toUTCString();
  }

  /**
   * confirm the delete with a modal before processing.
   * For Game objects, both the game as well as the underlying
   * tournament event will be deleted
   *
   * @param content TemplateRef for modal
   */
  onDelete(content: TemplateRef<any>) {
    console.log('delete clicked');

    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      (result) => {
        console.log('no action taken; closed with result ', result);
      },
      (reason) => {
        if (this.deleteConfirmed(reason)) {
          this.deleteGame();
        }
      },
    );
  }

  onSubmit() {
    console.log('submit pressed!');

    console.log('course selected: ', this.selectedCourse);

    if (this.id) {
      // existing gamer, update all fields
      this.updateGame(this.game, this.event);
    } else {
      // new gamer
      this.createGame(this.game, this.event);
    }
  }

  /**
   * deleting a game will actually delate the game and the associated
   * event object associated with this game.
   */
  private deleteGame() {
    const eventid = this.game.event;

    this.loading();

    this.eventApi
      .delete(eventid)
      .pipe(
        map((data) => console.log(`event ${eventid} deleted`)),

        // now delete the associated game
        mergeMap(() => this.gameApi.delete(this.game.id)),
        map((data) => console.log(`game ${this.game.id} deleted`)),

        catchError((err) => this.loadingError(`Error deleting game ${this.game.name}!`, err)),
      )
      .subscribe((data) => {
        this.loaded();
        this.router.navigate([this.parentUrl]);
      });
  }

  private deleteConfirmed(reason: ModalDismissReasons): boolean {
    const text = `${reason}`;

    console.log('text: ', text);

    if (text === this.confirmButton) {
      console.log('delete confirmed');
      return true;
    }

    return false;
  }

  private getRounds(d1: Date, d2: Date, courseid: string): any {
    const rounds = [];

    const start = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const end = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());

    // put in the course id for each round of the tournament
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    var days = Math.round(Math.abs((start.getTime() - end.getTime()) / oneDay)) + 1;

    // console.log('days: ', days);

    let currentDay = new Date(start.getTime());

    for (let i = 0; i < days; i++) {
      const round = {
        course: courseid,
        date: currentDay.toISOString(),
      };

      rounds.push(round);

      // move to next day
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return rounds;
  }

  private updateEvent(newEvent: Event, game: Game, event: Event): any {
    const start = game.start;
    const end = game.end;
    const courseid = this.selectedCourse.id;

    newEvent.name = game.name;
    newEvent.start = start;
    newEvent.end = end;
    newEvent.provider = event.provider;
    newEvent.scoreType = event.scoreType;
    newEvent.season = event.season;
    newEvent.tournament_id = this.selectedTourStop.tournament_id;
    newEvent.rounds = this.getRounds(new Date(start), new Date(end), courseid);

    console.log('newEvent: ', newEvent);

    return newEvent;
  }

  /**
   * Updating a game's info requires updating both the event
   * object as well as the game object in the backend store
   *
   * @param gamer
   * @param event
   */
  private updateGame(game: Game, event: Event) {
    this.loading();

    // get the event data, then update it
    this.eventApi
      .get(game.event)
      .pipe(
        map((newEvent) => {
          this.updateEvent(newEvent, game, event);
          return newEvent;
        }),

        // save event data first
        mergeMap((newEvent) => this.eventApi.put(newEvent)),
        map((data) => (game.event = data.id)),

        // then save game data
        mergeMap(() => this.gameApi.put(game)),
        map((data) => console.log('updated game ', data)),

        catchError((err) => this.loadingError('error updating data! ', err)),
      )
      .subscribe(() => {
        this.loaded();

        this.router.navigate([this.parentUrl]);
      });
  }

  private createGame(game: Game, event: Event) {
    console.log('creating game ', game);
    this.loading();

    const eventAttributes = event;
    this.updateEvent(eventAttributes, game, event);

    // save event data
    this.eventApi
      .post(event)
      .pipe(
        map((data) => {
          console.log('event data with id created: ', data.id);
          this.game.event = data.id;
          return data;
        }),

        // save game data
        mergeMap((data) => this.gameApi.post(game)),
        map((data) => {
          console.log('game data with id created: ', data.id);
          return data;
        }),

        catchError((err) => this.loadingError('Error creating game data', err)),
      )
      .subscribe(() => {
        this.loaded();
        this.router.navigate([this.parentUrl]);
      });
  }

  loadingError(msg: string, err: any) {
    console.log(msg, err);

    this.error(msg);

    return throwError(() => new Error(err));
  }
}
