Brickcell.setup(
    4,
    DigitalPin.P15,
    DigitalPin.P14,
    DigitalPin.P13,
    DigitalPin.P16
)
basic.forever(function () {
    Brickcell.scrollText(
        "Hello world!",
        50,
        50
    )
    for (let index = 0; index <= 23; index++) {
        Brickcell.displayCustomCharacter(
            Brickcell.getCustomCharacterArray(
                "B00100000,B01000000,B10000110,B10000000,B10000000,B10000110,B01000000,B00100000"
            ),
            index,
            true
        )
        basic.pause(200)
    }
})
