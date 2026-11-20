(() => {
  'use strict';

  const topics = [
    ['courses', 'Radat', 'Miten radoilla kannattaa edetä?'],
    ['home', 'Oma koti', 'Kerro kodistasi!'],
    ['keepsake', 'Tavarasi', 'Mitä sinulla on mukana?'],
    ['slide', 'Sateenkaariliuku', 'Miten sateenkaariliuku toimii?'],
    ['steps', 'Viiden sekunnin askelmat', 'Miten viiden sekunnin askelmat toimivat?'],
  ];
  const voices = {
    bun: {
      greeting: (player) =>
        'Hei, ' +
        player +
        '! Pysähdy hetkeksi, jos ehdit. Minusta on hauskaa jutella ohikulkijoiden kanssa.',
      courses: (course) =>
        course +
        ' on helpompi, kun katsot jo ennen loikkaa, mihin tassut laskeutuvat. Minä tähtään aina tyynyn pehmeään keskikohtaan.',
      home: (home) =>
        'Kotini on ' +
        home +
        '. Pidän oven vieressä porkkanakoria siltä varalta, että joku poikkeaa kylään nälkäisenä.',
      slide:
        'Sateenkaariliuku nappaa mukaansa portaiden yläpäästä. Voit ohjata sivulle. Minä kerään tassut kasaan ja annan vauhdin hiipua lopun tasanteella.',
      steps:
        'Kun astut askelmalle, sen viisi valopistettä alkavat sammua. Jos palaat askelmalle, saat taas täydet viisi sekuntia. Portaikon alkupäähän voi kävellä suoraan.',
      thanks: 'Ole hyvä! Minä heilutan täältä, kun lähdet.',
      farewell: 'Heippa! Pehmeitä laskeutumisia!',
      other:
        'Jäin miettimään tuota niin pitkäksi aikaa, että korvanikin menivät solmuun. Kysy vaikka, miten valitsen seuraavan hyppyni.',
    },
    bee: {
      greeting: (player) =>
        'Prrr, terve ' + player + '! Tulin juuri kotiin kierrokselta. Mitä radoille kuuluu?',
      courses: (course) =>
        'Teen aina pienen tiedustelukierroksen. Radalla ' +
        course +
        ' kannattaa ensin katsoa, mihin suuntaan este liikkuu, ja vasta sitten ottaa vauhtia.',
      home: (home) =>
        'Kotini on ' +
        home +
        '. Minulla on ikkunan alla kukkia, joihin löydän vaikka silmät kiinni. Tuoksu opastaa!',
      slide:
        'Liuku alkaa ihan itsestään, kun tulet portaiden päähän. Voit ohjata sivulle, vaikka vauhti kiihtyy. Lopussa on tasainen pätkä, jonka jälkeen ehdit hypätä.',
      steps:
        'Viisi valopistettä kertoo, kuinka kauan voit seistä askelmalla. Jos askelma ehtii pudota, odota viereisellä askelmalla hetki. Kohta siihen voi astua taas!',
      thanks: 'Prrr, ilo oli minun! Hyviä hyppyjä.',
      farewell: 'Nähdään taas! Taidan lentää vielä yhden kierroksen.',
      other:
        'Prrr, ajatus karkasi minulta kesken kierroksen. Kysy vaikka liu’usta tai katoavista askelmista, niin tiedän mistä aloittaa.',
    },
    hedgehog: {
      greeting: (player) =>
        'No hei, ' +
        player +
        '! Istuin juuri alas. Radalta näyttää olevan mukava poiketa välillä kylään.',
      courses: (course) =>
        'Radalla ' +
        course +
        ' pidän pieniä taukoja turvallisilla tyynyillä. Heiluvalla tyynyllä siirryn keskelle, jotta se pysyy paremmin tasapainossa.',
      home: (home) =>
        'Kotini on ' +
        home +
        '. Pehmustin kynnyksen, ettei siinä istuessa tule vilu. Siinä näkee koko päivän kulkijat.',
      slide:
        'Kun portaat loppuvat, liuku alkaa itsekseen. Ohjaan sivulle pienin liikkein ja annan vauhdin hiipua tasaisella loppupätkällä ennen seuraavaa hyppyä.',
      steps:
        'Odota rauhassa ennen ensimmäistä askelmaa. Kun astut sille, se kestää viisi sekuntia. Jokaisella askelmalla on omat viisi valopistettä ja oma laskurinsa.',
      thanks: 'Ole hyvä. Käväise toistekin, kun tassut kaipaavat lepoa.',
      farewell: 'Hei sitten. Turvallista matkaa tyynyltä toiselle.',
      other:
        'Hmm. Tarvitsisin tähän ehkä toisenkin teekupillisen. Radoista ja kodistani osaan kertoa jo nyt.',
    },
    moth: {
      greeting: (player) => 'Hei, ' + player + '. Oletko nähnyt, kuinka kauas radan valot näkyvät?',
      courses: (course) =>
        'Radan ' +
        course +
        ' hahmottaa parhaiten katsomalla yhtä tyynyä kerrallaan. Välilipulla voi levähtää ja jatkaa siitä, jos tassu lipsahtaa.',
      home: (home) => 'Kotini on ' + home + '. Jätän valon ikkunaan, jotta pimeälläkin löytää perille.',
      slide:
        'Portaiden huipulta värit vievät itsestään. Voit ohjata sivusuunnassa. Värien lopussa on tasainen jarrutusalue ennen seuraavaa hyppyä.',
      steps:
        'Katso askelman valopisteitä. Viimeisen valon sammuessa askelma putoaa, ja hetken kuluttua se palaa paikalleen valot taas kirkkaina.',
      thanks: 'Ole hyvä. Toivottavasti radan valot näyttävät sinulle tien.',
      farewell: 'Nähdään, kun palaat. Jätän valon ikkunaan.',
      other:
        'Ajatukseni harhaili hetkeksi valojen perässä. Voimme jutella vaikka radasta tai siitä, mistä tiedät askelman pian katoavan.',
    },
  };

  function topicFor(message) {
    const words = message.toLocaleLowerCase('fi-FI').match(/[\p{L}\p{N}]+/gu) || [];
    if (
      words.some((word) =>
        /^(tavar|esine|mukana|porkkan|hunajalus|kaukoput|kuulyh|lyht|ilmapall|tikkar|sauv)/.test(word),
      )
    )
      return 'keepsake';
    if (words.some((word) => /^(sateenka|liu|luisu|jarru)/.test(word))) return 'slide';
    if (words.some((word) => /^(askelm|por[rt]|sekunn|sekunt|katoa|valopiste)/.test(word)))
      return 'steps';
    if (words.some((word) => /^(ko(?:ti|to|din)|talo|asu[nst]|asua|maja)/.test(word))) return 'home';
    if (
      words.some((word) =>
        /^(rad|rat|hypp|este|tyyn|pilvipol|herkkulaak|tähtiyö|pilvivael|sammalleh|koralliriut|omenatarh|revontulijäät|ruusutarh|smaragdiniit|siniruusu|laguun|tulppaanitorn|välilip)/.test(
          word,
        ),
      )
    )
      return 'courses';
    if (words.some((word) => /^(kiitos|kiitti|thanks)/.test(word))) return 'thanks';
    if (words.some((word) => /^(heippa|nähdään|hyvästi)$/.test(word))) return 'farewell';
    if (words.some((word) => /^(moi|moikka|hei|heipä|terve|tervehdys|morjens|terkkuja)$/.test(word)))
      return 'greeting';
    return 'other';
  }

  const histories = new Map();
  const messageLimit = 24;

  function open(villager, player, course) {
    const voice = voices[villager.type] || voices.bun;
    const messages = histories.get(villager.id) || [
      { speaker: 'villager', text: voice.greeting(player) },
    ];
    histories.set(villager.id, messages);

    const view = document.createElement('section');
    view.className = 'village-chat';
    view.dataset.villager = villager.type;
    view.innerHTML = `
      <div class="village-chat-stage">
        <div class="village-speech">
          <h2 id="modal-title" aria-describedby="village-reply"></h2>
          <p id="village-reply" aria-live="polite" aria-atomic="true"></p>
        </div>
      </div>
      <div class="village-chat-panel">
        <div class="village-chat-topics" role="group" aria-label="Keskustelun aiheet"></div>
        <form class="village-chat-form">
          <input aria-label="Oma viesti" placeholder="Kirjoita viesti…" autocomplete="off" maxlength="160" required>
          <button class="primary" type="submit">Lähetä</button>
        </form>
        <details class="village-chat-history">
          <summary>Keskusteluhistoria</summary>
          <p class="village-chat-empty">Ei aiempia viestejä.</p>
          <ol class="village-chat-log" role="list" aria-label="Aiemmat viestit" tabindex="0" hidden></ol>
        </details>
        <p class="village-chat-home"></p>
        <button class="secondary village-chat-close" type="button">Palaa peliin</button>
      </div>
    `;
    view.querySelector('h2').textContent = villager.name;
    view.querySelector('.village-chat-home').textContent = villager.home;
    const speech = view.querySelector('#village-reply');
    const history = view.querySelector('.village-chat-history');
    const log = view.querySelector('.village-chat-log');
    const empty = view.querySelector('.village-chat-empty');
    const topicsList = view.querySelector('.village-chat-topics');
    const form = view.querySelector('.village-chat-form');
    const input = form.querySelector('input');

    function renderMessage({ speaker, text }) {
      const row = document.createElement('li');
      const label = document.createElement('strong');
      const copy = document.createElement('p');
      row.className = 'village-chat-message ' + speaker;
      label.textContent = speaker === 'villager' ? villager.name : player;
      copy.textContent = text;
      row.append(label, copy);
      log.append(row);
    }

    function updateSpeech() {
      speech.textContent = messages.at(-1).text;
      log.hidden = !log.childElementCount;
      empty.hidden = !log.hidden;
      log.scrollTop = log.scrollHeight;
    }

    function say(text, topic) {
      const answer = topic === 'keepsake' ? villager.itemStory : voice[topic];
      const context = { greeting: player, courses: course, home: villager.home };
      const reply = typeof answer === 'function' ? answer(context[topic]) : answer;
      const question = { speaker: 'player', text };
      renderMessage(messages.at(-1));
      renderMessage(question);
      messages.push(question, { speaker: 'villager', text: reply });
      if (messages.length > messageLimit) {
        const overflow = messages.length - messageLimit;
        messages.splice(0, overflow);
        for (let i = 0; i < overflow; i++) log.firstElementChild.remove();
      }
      updateSpeech();
    }

    messages.slice(0, -1).forEach(renderMessage);
    updateSpeech();
    history.addEventListener('toggle', () => {
      if (history.open) log.scrollTop = log.scrollHeight;
    });
    for (const [topic, label, question] of topics) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', () => say(question, topic));
      topicsList.append(button);
    }
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const message = input.value.trim();
      if (!message) return;
      input.value = '';
      say(message, topicFor(message));
    });
    return view;
  }

  window.FluffVillageChat = { open, reset: () => histories.clear() };
})();
