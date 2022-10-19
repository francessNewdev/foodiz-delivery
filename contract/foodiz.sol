// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

contract Foodiz {
    uint256 private mealsLength = 0;
    address private owner;

    struct Order {
        uint256 mealId;
        uint256 count;
    }

    struct Meal {
        string name;
        string image;
        uint256 price;
        uint256 sold;
    }

    mapping(uint256 => Meal) private meals;
    mapping(uint256 => bool) private mealExists;

    constructor() {
        owner = msg.sender;
    }

    /**
        * @dev allows the owner to add new meals to the plaform
        * @notice caller of the function needs to be the owner
     */
    function addNewMeal(
        string calldata _name,
        string calldata _image,
        uint256 _price
    ) public {
        require(owner == msg.sender, "Only the owner is allowed to add new meals");
        require(bytes(_name).length > 0, "Empty name");
        require(bytes(_image).length > 0, "Empty image");
        require(_price > 0, "Price must be greater than 0");
        uint256 _sold = 0;
        uint index = mealsLength;
        mealsLength++;
        meals[index] = Meal(_name, _image, _price, _sold);
        mealExists[index] = true;
    }

    /**
        * @dev allow users to place orders of meals that exist on the platform
        * @notice you can only order ten meals at a time

     */
    function placeOrder(Order[] memory _orders) public payable {
        require(owner != msg.sender,"You can't place orders as the owner");
        require(_orders.length <= 10, "You can only order ten meals at a time");
        uint256 _totalAmount;
        for (uint256 i = 0; i < _orders.length; i++) {
            Order memory _order = _orders[i];
            Meal storage _meal = meals[_order.mealId];
            require(mealExists[_order.mealId] == true, "Meal does not exist");
            _totalAmount += _meal.price * _order.count;
            _meal.sold += _order.count;
        }
        require(_totalAmount == msg.value, "Invalid Amount Sent");
        // transfer amount
        (bool success, ) = payable(owner).call{value: msg.value}("");
        require(success, "Transfer of order amount failed");
    }

    function getMeal(uint256 _index)
        public
        view
        returns (
            string memory,
            string memory,
            uint256,
            uint256
        )
    {
        return (
            meals[_index].name,
            meals[_index].image,
            meals[_index].price,
            meals[_index].sold
        );
    }

    function getMealslength() public view returns (uint256) {
        return (mealsLength);
    }
}
