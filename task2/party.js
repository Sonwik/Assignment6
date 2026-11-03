// The party from the picture, written as data.
// Rooms keep their name and floor. Guests are listed from left to right.
// color  : clothing color (ring around the avatar)
// time   : arrival time
// aitu   : true if the guest is an AITU student
// things : phone, glasses, bag, cup, crumbs (cake crumbs)

const PARTY = {
  title: 'The Party, 19:30 – 22:30',
  rooms: [
    {
      id: 'balcony', name: 'Balcony', floor: 2,
      guests: [
        { name: 'Aigerim', color: 'green',  time: '20:45', aitu: true,  things: ['cup', 'crumbs'] },
        { name: 'Aliya',   color: 'black',  time: '21:15', aitu: false, things: ['phone', 'cup'] },
        { name: 'Madina',  color: 'green',  time: '22:10', aitu: false, things: ['phone', 'bag', 'crumbs'] },
        { name: 'Ivan',    color: 'black',  time: '20:10', aitu: true,  things: ['cup'] }
      ]
    },
    {
      id: 'hall', name: 'Hall', floor: 2,
      guests: [
        { name: 'Arman',   color: 'yellow', time: '20:35', aitu: false, things: ['bag', 'glasses'] },
        { name: 'Sophia',  color: 'purple', time: '21:20', aitu: true,  things: ['phone'] },
        { name: 'Dias',    color: 'green',  time: '19:45', aitu: true,  things: [] },
        { name: 'Bekzat',  color: 'purple', time: '20:55', aitu: false, things: ['bag', 'cup', 'crumbs'] },
        { name: 'Aruzhan', color: 'blue',   time: '21:50', aitu: true,  things: ['phone'] },
        { name: 'Saule',   color: 'green',  time: '21:25', aitu: false, things: ['glasses'] }
      ]
    },
    {
      id: 'kitchen', name: 'Kitchen', floor: 1,
      guests: [
        { name: 'Nurlan',  color: 'red',    time: '19:40', aitu: true,  things: ['phone', 'cup'] },
        { name: 'Emma',    color: 'black',  time: '20:15', aitu: false, things: ['bag'] },
        { name: 'Timur',   color: 'green',  time: '21:05', aitu: true,  things: ['phone', 'bag', 'crumbs'] },
        { name: 'Sergey',  color: 'yellow', time: '20:50', aitu: false, things: [] },
        { name: 'Yerlan',  color: 'red',    time: '21:40', aitu: true,  things: ['glasses', 'phone'] },
        { name: 'Kamila',  color: 'green',  time: '20:05', aitu: false, things: ['cup'] }
      ]
    },
    {
      id: 'living', name: 'Living room', floor: 1,
      guests: [
        { name: 'Daniel',  color: 'blue',   time: '19:55', aitu: true,  things: ['glasses'] },
        { name: 'Zarina',  color: 'green',  time: '21:10', aitu: false, things: ['bag', 'phone', 'crumbs'] },
        { name: 'Natasha', color: 'yellow', time: '20:30', aitu: true,  things: [] },
        { name: 'Askar',   color: 'black',  time: '21:00', aitu: true,  things: ['phone'] },
        { name: 'Inkar',   color: 'purple', time: '20:20', aitu: false, things: ['bag'] }
      ]
    }
  ]
};

// Case 18: the late guest who is added to the page (he is not in the picture).
const MIRAS = { name: 'Miras', color: 'blue', time: '21:20', aitu: true, things: ['phone'] };
