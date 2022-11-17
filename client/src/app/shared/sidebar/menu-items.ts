import { RouteInfo } from './sidebar.metadata';

export const ROUTES = (admin: boolean) : RouteInfo[] => {
  const userTasks : RouteInfo[] = [
    {
      path: '',
      title: 'Golfpicks',
      icon: 'bi bi-speedometer2',
      class: 'nav-small-cap',
      extralink: true,
      submenu: []
    },
    {
      path: '/component/gamehistory',
      title: 'My Games',
      icon: 'bi bi-person',
      class: '',
      extralink: false,
      submenu: []
    },
    {
      path: '/about',
      title: 'About Golfpicks',
      icon: 'bi bi-info-circle',
      class: '',
      extralink: false,
      submenu: []
    }
  ];

  const adminTasks: RouteInfo[] = [
    {
      path: '',
      title: 'Admin Tasks',
      icon: 'bi bi-bell',
      class: 'nav-small-cap',
      extralink: true,
      submenu: []
    },
    {
      path: '/component/games',
      title: 'Games',
      icon: 'bi bi-trophy',
      class: '',
      extralink: false,
      submenu: []
    },
    {
      path: '/component/events',
      title: 'Tournaments',
      icon: 'bi bi-flag',
      class: '',
      extralink: false,
      submenu: []
    },
    {
      path: '/component/courses',
      title: 'Courses',
      icon: 'bi bi-geo-alt',
      class: '',
      extralink: false,
      submenu: []
    },
    {
      path: '/component/users',
      title: 'Players',
      icon: 'bi bi-people',
      class: '',
      extralink: false,
      submenu: []
    }
  ];

  return admin ? userTasks.concat(adminTasks) : userTasks ;
}

