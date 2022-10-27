// SPDX-License-Identifier: MIT

/** @title Foodiz contract
 *  @notice Contract in charge of the foodiz marketplace
 */
pragma solidity >=0.7.0 <0.9.0;

contract Foodiz {
    uint256 internal mealsLength = 0;
    address internal owner;

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

    // mapping of meal ids to the meal details
    mapping(uint256 => Meal) internal meals;

    // mapping to show if meal exists
    mapping(uint256 => bool) internal mealExists;

    /**
     * @notice Constructor that sets owner to who deploys the contract
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice adds new meal to foodiz contract
     * @param _name: meal name
     * @param _image: meal image
     * @param _price: meal price
     */
    function addNewMeal(
        string memory _name,
        string memory _image,
        uint256 _price
    ) public {
        require(_price > 0, "Price must be greater than 0");
        uint256 _sold = 0;
        meals[mealsLength] = Meal(_name, _image, _price, _sold);
        mealExists[mealsLength] = true;
        mealsLength++;
    }

    /**
     * @notice places orders
     * @param _orders: pizza order
     */
    function placeOrder(Order[] memory _orders) public payable {
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

    /**
     * @notice returns meal information
     * @param _index: meal index
     */
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

    /**
     * @notice returns the amount of meals in the contract
     */
    function getMealslength() public view returns (uint256) {
        return (mealsLength);
    }
}
