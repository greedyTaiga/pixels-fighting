//variables of the matrices
var size, width, height, step; 
var canv, ctx;
var totalSum;

var frameLength;

//set default colors
color1 = "#5398BE";
color2 = "#F2CD5D";

var minRequiredColorDif = 50;  //variable to control how similar colors can be

gameEndTriggered = false;  //variable to see if the game end has been triggered
var gameEndTimer = 1000; //how long to wait before displaying the Game End screen in milliseconds
var winningColor;

//function for determining if 2 colors are too similar
function tooSimilar(c1, c2, maxSimilarityFactor){
    c1 = c1.toString(7);
    c2 = c2.toString(7);
    
    var r1 = parseInt(c1[1] + c1[2], 16);
    var g1 = parseInt(c1[3] + c1[4], 16);
    var b1 = parseInt(c1[5] + c1[6], 16);

    var r2 = parseInt(c2[1] + c2[2], 16);
    var g2 = parseInt(c2[3] + c2[4], 16);
    var b2 = parseInt(c2[5] + c2[6], 16);

    var dif = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);

    if (dif < maxSimilarityFactor) return true;
    else return false;
}

function Setup(){
    gameEndTriggered = false;

    startTheFightButton = document.getElementById('startButton');
    startTheFightButton.disabled = false;

    //Set up the matrice
    canv = document.getElementById('battlegroundCanvas');    
    ctx = canv.getContext('2d');
    height = canv.height;  
    width = canv.width;
    size = 100;
    step = width / size;
    frameLength = Math.min(200 / size, 1); // set how frequent should the interval be, depends on the size 
    totalSum = 0;
    
    //Choose random colors using Please JS v0.4.2, if colors are too similar, choose another random colors
    do {
        color1 = Please.make_color();
        color2 = Please.make_color();
    } while (tooSimilar(color1, color2, minRequiredColorDif));

    //Set up the versus message
    vsSpan1 = document.getElementById('vsSpan1');
    vsSpan1.innerHTML = color1;
    vsSpan1.style.color = color1;

    vsSpan2 = document.getElementById('vsSpan2');
    vsSpan2.innerHTML = color2;
    vsSpan2.style.color = color2;

    //Fill in the matrices
    Initialize();
}

function StartTheFight(){
    
    
    startTheFightButton.disabled = true; //disable the start the fight button

    interval = setInterval(Run, frameLength); //set up an interval to call the Run function
}

function Initialize() { 
    //create our matrices
    pixels = new Array(size);    
    ratios = new Array(size);
    neighbourAmount = new Array(size);

    for (let i = 0; i < size; i ++) {     
        //add the rows to our matrices
        pixels[i] = new Array(size);        
        ratios[i] = new Array(size);
        neighbourAmount[i] = new Array(size);

        for (let j = 0; j < size; j ++) {
            //ratios are all set up as 0 at the start
            ratios[i][j] = 0;               

            //place the colors (color1 = 1, color2 = 0)        
            if (i < size / 2) { pixels[i][j] = 1;}            
            else {                
                pixels[i][j] = 0;            
            }

            //set the neightbouring amounts which are 3 if in the corners, 5 if adjacent to a wall, and 8 if in center
            if (i === 0 || i === size - 1) {                
                if (j === 0 || j === size - 1) {neighbourAmount[i][j] = 3;}                
                else {neighbourAmount[i][j] = 5}            
            }            
            else if (j == 0 || j == size - 1) {neighbourAmount[i][j] = 5;}
            else {
                neighbourAmount[i][j] = 8;
            }
        }    
    }

    //Draw the initial state of the battleground
    Draw();
}

function Draw(){
    
    for (let i = 0; i < size; i ++) {
        for (let j = 0; j < size; j ++) {  
            
            //decide what color position i,j should be
            ctx.fillStyle = color2;   
            if (pixels[i][j] == 1) {
                ctx.fillStyle = color1;
            }    
            
            if (gameEndTriggered) {
                ctx.fillStyle = winningColor;
            }

            //draw the rectangle with the chosen color on position i,j
            ctx.fillRect(i * step, j * step, step, step);   
            
        }    
    }
}

function CalculateRatios(){

    for (let i = 0; i < size; i ++) {
        for (let j = 0; j < size; j ++) {
            //count the sum of 1s neihgbouring the i, j position
            let pixSum = 0;
            if (i > 0) {
                pixSum += pixels[i - 1][j];
                if (j > 0) pixSum += pixels[i - 1][j - 1];
                if (j < size - 1) pixSum += pixels[i - 1][j + 1];
            }
            if (i < size - 1) {
                pixSum += pixels[i + 1][j];
                if (j > 0) pixSum += pixels[i + 1][j - 1];
                if (j < size - 1) pixSum += pixels[i + 1][j + 1];
            }
            if (j > 0) pixSum += pixels[i][j - 1];
            if (j < size - 1) pixSum += pixels[i][j + 1];
            
            //calculate the ratio of sum of 1s to the total amount of neighbouring positions
            ratios[i][j] = pixSum / neighbourAmount[i][j];
        }
    }
}

function CalculateWinningPixels(){

    for (let i = 0; i < size; i ++) {
        for (let j = 0; j < size; j ++) {

            //set a random ratio between 0 and 1, and use it to determine which color takes the position i,j
            let randomRatio = Math.random();
            if (ratios[i][j] > randomRatio) {
                pixels[i][j] = 1;
            } else {
                pixels[i][j] = 0;
            }
        }
    }
}

function CountPixels(){

    let sum = 0;

    for (let i = 0; i < size; i ++) {
        for (let j = 0; j < size; j ++) {

            sum += pixels[i][j];
        }
    }

    return sum;
}

function Run(){
    
    CalculateRatios();  //calculate ratios  
    CalculateWinningPixels();  //use the ratios to determine which color takes the positions
    Draw();  //draw the colors on the canvas

    totalSum = CountPixels(); //count the amount of color1 pixels

    if (gameEndTriggered) return; //if the game end function has been triggered, stop checking for the game end

    //use the total sum of 1s to see if any color has won, and call the GameEnd function, giving it the winning color
    if (totalSum == size*size){
        gameEndTriggered = true;
        winningColor = color1;
        setTimeout(GameEnd, gameEndTimer);
    }
    if (totalSum == 0) {
        gameEndTriggered = true;
        winningColor = color2;
        setTimeout(GameEnd, gameEndTimer);
    }
    
}

function GameEnd(){

    clearInterval(interval); //clear the interval that was calling Run every frameLength seconds

    //Print out the game end screen through HTML
    var modal = document.getElementById('gameEndModal');
    modal.style.display = 'block';

    var winningColorSpan = document.getElementById('winningColor');
    winningColorSpan.innerHTML = winningColor;
    winningColorSpan.style.color = winningColor;

    var restartButton = document.getElementsByClassName("restart")[0];
    restartButton.onclick = function(){
        modal.style.display = 'none';
        Setup();
    }
    
}