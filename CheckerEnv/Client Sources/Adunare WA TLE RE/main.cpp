#include <fstream>

using namespace std;

ifstream cin("adunare.in");
ofstream cout("adunare.out");

int main()
{
    int a, b;
    cin >> a >> b;

    if(a == 43) {
        cout << 43 / 0 << '\n';
    } else if(a == -2) {
        while(1){};
    } else {
        cout << a + b;
    }

    return 0;
}
