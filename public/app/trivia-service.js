"use strict";

function TriviaService($http, $location) {
    const self = this;
    // Creates user object with properties based on parameters and initial state of drunkenness
    self.setUser = (difficulty, tolerance) => {
        self.user = {
            difficulty: difficulty,
            tolerance: tolerance,
            drunkenness: 0
        }
    }
    // Routes back to title screen to start a new game
    self.newGame = () => {
        $location.path('/titleScreen');
    }
    // Increments users drunkenness based on abv of selected beer
    self.updateDrunkenness = (abv, roundNum) => {
        self.user.drunkenness = self.user.drunkenness + Math.round((Number(abv) / Number(self.user.tolerance)) + 1);
        if (self.user.drunkenness < 0) {
            self.user.drunkenness = 0;
        }
        self.addAnimation(roundNum, self.user.drunkenness);
    }

    self.getUser = () => {
        return self.user;
    }
    // Shuffles an array using  Fisher-Yates shuffle 
    self.shuffle = (array) => {
        for (let i = array.length - 1; i >= 0; i--) {

            let randomIndex = Math.floor(Math.random() * (i + 1));
            let itemAtIndex = array[randomIndex];

            array[randomIndex] = array[i];
            array[i] = itemAtIndex;
        }
        return array;
    }
    //Makes a call to the BreweryDB API and replaces missing abv values with default value of 4.5
    self.loadBeer = () => {
        return $http({
            url: "/beer",
            method: "GET"
        }).then((result) => {
            self.beerList = result.data.data;
            for (let entry of self.beerList) {
                if (!entry.abv) {
                    entry.abv = 4.5;
                }
            }
        });
    }
    // Returns 3 random beers from the array returned by API and removes them from from array
    self.getBeer = () => {
        self.beerList = self.shuffle(self.beerList);
        return self.beerList.splice(0, 3);
    }
    // Makes call the Open Trivia API and returns an object containing a question and 4 possible answers
    self.getTrivia = (difficulty) => {
        // Limits API call to specific categories and randomly selects one
        self.categoryList = [12, 14, 16, 21, 23, 25, 27];
        self.category = self.categoryList[Math.floor(Math.random() * self.categoryList.length)];
        // GET request to API with randomized category and difficulty specified by parameter
        return $http({
            method: "GET",
            url: `https://opentdb.com/api.php?amount=1&category=${self.category}&difficulty=${difficulty}&type=multiple`
        }).then((result) => {
            self.trivia = result.data.results["0"];
            // Method to replace invalid character with their correct counterpart
            self.fix = (string) => {
                return string.replace(/&quot;/g, "\"")
                    .replace(/&Delta;/g, "\∆")
                    .replace(/&amp;/g, "\&")
                    .replace(/&#039;/g, "\'")
                    .replace(/&eacute;/g, "\é")
                    .replace(/&rsquo;/g, "\'")
                    .replace(/&shy;/g, "\-")
                    .replace(/&Uuml;/g, "\Ü")
                    .replace(/&ouml;/g, "\ö")
                    .replace(/&ntilde;/g, "\ñ")
                    .replace(/&aacute;/g, "\á")
                    .replace(/&Ocirc;/g, "\Ô")
                    .replace(/&uacute;/g, "\ú")
                    .replace(/&egrave;/g, "\è")
                    .replace(/&szlig;/g, "\ß")
                    .replace(/&ecirc;/g, "\ê")
                    .replace(/&ocirc;/g, "\û")
                    .replace(/&uuml;/g, "\ü");

            }

            self.question = {
                question: self.fix(self.trivia.question),
                answers: [{
                        answer: self.fix(self.trivia.incorrect_answers[0]),
                        eval: false
                    },
                    {
                        answer: self.fix(self.trivia.incorrect_answers[1]),
                        eval: false
                    },
                    {
                        answer: self.fix(self.trivia.incorrect_answers[2]),
                        eval: false
                    },
                    {
                        answer: self.fix(self.trivia.correct_answer),
                        eval: true
                    }
                ]
            }
            self.question.answers = self.shuffle(self.question.answers);
            return self.question
        })
    }
    // Function that parses the stylesheet to look for keyframes rule identified by parameter
    self.findKeyframesRule = (rule) => {
        var ss = document.styleSheets;
        for (let j = 0; j < ss[4].cssRules.length; j++) {
            if (ss[4].cssRules[j].name == rule) {
                return ss[4].cssRules[j];
            }
        }
    }
    // Removes animation classes based on round parameter to prevent them from stacking on each other throughout game
    self.removeAnimation = (round) => {
        switch (round) {
            case 3:
                document.querySelectorAll(".question")[0].classList.remove('round2');
                document.querySelectorAll(".answers")[0].classList.remove('round2');
                break;
            case 4:
                document.getElementById("distraction-pic").style.display = "none";
                break;
            case 5:
                document.querySelectorAll(".question")[0].classList.remove('round4');
                document.querySelectorAll(".answers")[0].classList.remove('round4');
                break;
        }
    }
    // Function used by round 5 animation to wrap individual characters in spans so they can be animated seperately
    self.setUpCharacters = () => {
        let question = document.querySelectorAll(".question");
        for (let sentence of question) {
            let newContent = '';
            for (let i = 0; i < sentence.textContent.length; i++) {
                let substring = sentence.textContent.substr(i, 1);
                if (substring != " ") {
                    if (i % 2 === 0) {
                        newContent += '<span class="rotate">' + substring + '</span>';
                    } else {
                        newContent += '<span class="rotateccw">' + substring + '</span>';
                    }
                } else {
                    newContent += substring;
                }
            }
            sentence.innerHTML = newContent;
        }
        let answers = document.querySelectorAll(".answer");
        for (let answer of answers) {
            let newContent = '';
            for (let i = 0; i < answer.textContent.length; i++) {
                let substring = answer.textContent.substr(i, 1);
                if (substring != " ") {
                    if (i % 2 === 0) {
                        newContent += '<span class="rotate">' + substring + '</span>';
                    } else {
                        newContent += '<span class="rotateccw">' + substring + '</span>';
                    }
                } else {
                    newContent += substring;
                }
            }
            answer.innerHTML = newContent;
        }
    }
    //Adds animation class to questions and answers based on number provided by round number and severity based on drunkenness parameter
    self.addAnimation = (round, drunkenness) => {
        switch (round) {
            case 2:
                document.querySelectorAll(".question")[0].classList.add('round2');
                document.querySelectorAll(".answers")[0].classList.add('round2');
                let textShadow = '';
                for (let i = 1; i <= drunkenness; i++) {
                    if (i % 2 === 0) {
                        textShadow += `-${2.5 * i}px -${2.5 * i}px ${i}px rgba(0, 0, 0, ${(1-(1/i))/2}),`;
                    } else {
                        textShadow += `${2.5 * i}px ${2.5 * i}px ${i}px rgba(0, 0, 0, ${(1-(1/i))/2}),`;
                    }
                }
                textShadow = textShadow.substring(0, textShadow.length - 1);
                let xvision = self.findKeyframesRule("xvision");
                xvision.appendRule('0% {text-shadow: 0px 0px 0px rgba(0,0,0, 1);}');
                xvision.appendRule(`100% {text-shadow: ${textShadow};}`);
                break;
            case 3:
                let distract = self.findKeyframesRule("distract");
                document.getElementById("distraction-pic").style.display = "inline-block";
                document.getElementById("distraction-pic").style.animation = `distract 3s linear 1s infinite alternate`;
                distract.appendRule(`${100-(3 * drunkenness)}% {opacity: 1; z-index: 100;}`);
                distract.appendRule(`100% {opacity: 1; z-index: 100;}`);
                break;
            case 4:
                document.querySelectorAll(".question")[0].classList.add('round4');
                document.querySelectorAll(".answers")[0].classList.add('round4');
                let focus = self.findKeyframesRule("focus");
                focus.appendRule(`100% {filter: blur(${1.5 * drunkenness}px);}`);
                break;
            case 5:
                let rot = self.findKeyframesRule("rot");
                rot.appendRule(`from { transform: rotate(0deg) translate(-${drunkenness}px) rotate(0deg);}`);
                rot.appendRule(`to { transform: rotate(360deg) translate(-${drunkenness}px) rotate(-360deg);}`);

                let rotccw = self.findKeyframesRule("rotccw");
                rotccw.appendRule(`from { transform: rotate(0deg) translate(-${drunkenness}px) rotate(0deg);}`);
                rotccw.appendRule(`to { transform: rotate(-360deg) translate(-${drunkenness}px) rotate(360deg);}`);
                break;
        }
    }
}

angular
    .module("HopsAcademy")
    .service("TriviaService", TriviaService)