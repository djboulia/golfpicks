import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

import { mergeMap, map, catchError, throwError } from 'rxjs';

import { GameService } from '../../shared/services/golfpicks/game.service';
import { CourseService } from '../../shared/services/golfpicks/course.service';
import { EventService } from '../../shared/services/golfpicks/event.service';

import { Game } from '../../shared/services/golfpicks/game.model';
import { Course } from '../../shared/services/golfpicks/course.model';
import { Event } from '../../shared/services/golfpicks/event.model';

import { DateHelperService } from '../../shared/services/date/date-helper.service';
import { ModalService } from '../../shared/services/modal.service';
import { LoaderService } from '../../shared/services/loader.service';
import { PageLoadComponent } from '../../shared/components/common/page-load/page-load.component';
import { ModalConfirmComponent } from '../../shared/components/common/modal-confirm/modal-confirm.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { Option, SelectComponent } from '../../shared/components/form/select/select.component';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  imports: [
    PageLoadComponent,
    ModalConfirmComponent,
    ButtonComponent,
    InputFieldComponent,
    SelectComponent,
    DatePickerComponent,
    DatePipe,
  ],
})
export class GameComponent implements OnInit {
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
    private route: ActivatedRoute,
    private router: Router,
    private gameApi: GameService,
    private courseApi: CourseService,
    private eventApi: EventService,
    protected deleteModal: ModalService,
    protected loader: LoaderService,
  ) {
    this.game = gameApi.newModel();
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    console.log(`id: ${this.id}`);

    if (this.id) {
      // edit an existing game
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
    this.loader.setLoading(true);

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
      .subscribe(() => {
        this.selectedCourse = this.findCourse(this.event, this.courses);
        this.selectedTourStop = this.findTourStop(this.event, this.schedule);

        this.loader.setLoading(false);
      });
  }

  loadNewGame() {
    this.loader.setLoading(true);

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
        this.onTourStopChanged(this.selectedTourStop.tournament_id);

        this.loader.setLoading(false);
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

  getTourStops(): Option[] {
    return this.schedule?.map((s: any) => {
      return { value: s.tournament_id, label: s.name };
    });
  }

  /**
   * When the course drop down is changed, update our game start
   * and end dates to match
   *
   * @param tourstop
   */
  onTourStopChanged(tournamentId: string) {
    console.log('tour stop changed to: ', tournamentId);

    const tourstop = this.schedule.find((s: any) => s.tournament_id === tournamentId);
    if (!tourstop) return;

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
    console.log('game start: ', this.game.start, ' , game end: ', this.game.end);
  }

  getCourses(): Option[] {
    return this.courses?.map((c: any) => {
      return { value: c.id, label: c.name };
    });
  }

  onCourseChanged(courseId: string) {
    console.log('course changed to: ', courseId);
    this.selectedCourse = this.courses.find((c: any) => c.id === courseId);
    console.log('selected course: ', this.selectedCourse);
  }

  onStartDateChange(event: any) {
    const selectedDate = new Date(event.dateStr);
    this.game.start = selectedDate.toUTCString();
    console.log('start date changed: ', this.game.start);
  }

  onEndDateChange(event: any) {
    console.log('end date changed: ', event);
    const selectedDate = new Date(event.dateStr);
    this.game.end = selectedDate.toUTCString();
  }

  /**
   * confirm the delete with a modal before processing.
   */
  onDelete() {
    console.log('delete clicked');
    this.deleteModal.openModal();
  }

  onCancel() {
    console.log('cancel pressed!');
    this.deleteModal.closeModal();
  }

  onConfirm() {
    console.log('confirm pressed!');
    this.deleteGame();
    this.deleteModal.closeModal();
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

    this.loader.setLoading(true);

    this.eventApi
      .delete(eventid)
      .pipe(
        map(() => console.log(`event ${eventid} deleted`)),

        // now delete the associated game
        mergeMap(() => this.gameApi.delete(this.game.id)),
        map(() => console.log(`game ${this.game.id} deleted`)),

        catchError((err) => this.loadingError(`Error deleting game ${this.game.name}!`, err)),
      )
      .subscribe(() => {
        this.loader.setLoading(false);
        this.router.navigate([this.parentUrl]);
      });
  }

  private getRounds(d1: Date, d2: Date, courseid: string): any {
    const rounds = [];

    const start = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const end = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());

    // put in the course id for each round of the tournament
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const days = Math.round(Math.abs((start.getTime() - end.getTime()) / oneDay)) + 1;

    // console.log('days: ', days);

    const currentDay = new Date(start.getTime());

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
    this.loader.setLoading(true);

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
        this.loader.setLoading(false);

        this.router.navigate([this.parentUrl]);
      });
  }

  private createGame(game: Game, event: Event) {
    console.log('creating game ', game);
    this.loader.setLoading(true);

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
        mergeMap(() => this.gameApi.post(game)),
        map((data) => {
          console.log('game data with id created: ', data.id);
          return data;
        }),

        catchError((err) => this.loadingError('Error creating game data', err)),
      )
      .subscribe(() => {
        this.loader.setLoading(false);
        this.router.navigate([this.parentUrl]);
      });
  }

  loadingError(msg: string, err: any) {
    console.log(msg, err);

    this.loader.setErrorMessage(msg);

    return throwError(() => new Error(err));
  }
}
