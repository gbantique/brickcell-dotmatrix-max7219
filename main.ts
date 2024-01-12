let dotmatrix8x8 = Brickcell.create()
dotmatrix8x8.setup(
dotmatrix8x8,
DigitalPin.P16,
DigitalPin.P15,
DigitalPin.P14,
DigitalPin.P13
)
basic.forever(function () {
    dotmatrix8x8.scrollText(
    dotmatrix8x8,
    50,
    50
    )
    for (let index = 0; index <= 23; index++) {
        dotmatrix8x8.getCustomCharacterArray(
        dotmatrix8x8
        ).displayCustomCharacter(
        dotmatrix8x8.getCustomCharacterArray(
        dotmatrix8x8
        ),
        index,
        true
        )
        basic.pause(50)
    }
})
